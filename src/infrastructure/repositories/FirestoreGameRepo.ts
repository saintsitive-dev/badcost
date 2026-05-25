import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Game, Participant } from '../../domain/entities/Game';
import { generateInviteCode } from '../../domain/entities/Game';

const GAMES_COLLECTION = 'games';
const PARTICIPANTS_SUBCOLLECTION = 'participants';

export async function createGame(hostId: string, gameData: Omit<Game, 'id' | 'hostId' | 'inviteCode' | 'createdAt' | 'status'>): Promise<Game> {
  const inviteCode = generateInviteCode();
  const gameDateObj = new Date(`${gameData.date}T${gameData.startTime}`);
  // Auto-delete 3 months after game date
  const expireAt = new Date(gameDateObj);
  expireAt.setMonth(expireAt.getMonth() + 3);

  const gameDoc = {
    ...gameData,
    hostId,
    inviteCode,
    status: 'open',
    createdAt: serverTimestamp(),
    gameDate: Timestamp.fromDate(gameDateObj),
    expireAt: Timestamp.fromDate(expireAt),
  };

  const docRef = await addDoc(collection(db, GAMES_COLLECTION), gameDoc);
  return {
    ...gameData,
    id: docRef.id,
    hostId,
    inviteCode,
    status: 'open',
    createdAt: new Date().toISOString(),
    gameDate: gameDateObj.toISOString(),
  };
}

export async function getGameByInviteCode(inviteCode: string): Promise<Game | null> {
  const q = query(collection(db, GAMES_COLLECTION), where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return docToGame(docSnap.id, docSnap.data());
}

export async function getGameById(gameId: string): Promise<Game | null> {
  const docSnap = await getDoc(doc(db, GAMES_COLLECTION, gameId));
  if (!docSnap.exists()) return null;
  return docToGame(docSnap.id, docSnap.data());
}

export async function getGamesByHost(hostId: string): Promise<Game[]> {
  const q = query(
    collection(db, GAMES_COLLECTION),
    where('hostId', '==', hostId),
    orderBy('gameDate', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToGame(d.id, d.data()));
}

export async function getVisibleGames(inviteCode: string): Promise<Game[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, GAMES_COLLECTION),
    where('inviteCode', '==', inviteCode),
    where('gameDate', '>=', Timestamp.fromDate(oneWeekAgo)),
    orderBy('gameDate', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToGame(d.id, d.data()));
}

export async function updateGame(gameId: string, data: Partial<Game>): Promise<void> {
  const { id, ...updateData } = data as Game;
  await updateDoc(doc(db, GAMES_COLLECTION, gameId), updateData);
}

export async function deleteGame(gameId: string): Promise<void> {
  // Delete all participants first
  const participantsRef = collection(db, GAMES_COLLECTION, gameId, PARTICIPANTS_SUBCOLLECTION);
  const snapshot = await getDocs(participantsRef);
  const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  // Delete the game
  await deleteDoc(doc(db, GAMES_COLLECTION, gameId));
}

// Participant operations

/**
 * Single function to add a participant to a game.
 * Handles: duplicate name check, max player enforcement, status update.
 * Used by both user self-join and host-add flows.
 */
async function addParticipantToGame(
  gameId: string,
  name: string,
  deviceId: string,
): Promise<Participant> {
  const participantsRef = collection(db, GAMES_COLLECTION, gameId, PARTICIPANTS_SUBCOLLECTION);

  return await runTransaction(db, async (transaction) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) throw new Error('Game not found');

    const gameData = gameSnap.data();
    const participantsSnap = await getDocs(participantsRef);
    const currentCount = participantsSnap.size;

    // Duplicate name prevention
    const duplicate = participantsSnap.docs.find(d => d.data().name.toLowerCase() === name.toLowerCase());
    if (duplicate) throw new Error('ชื่อนี้มีอยู่แล้ว');

    // Max player enforcement
    if (gameData.maxPlayers && currentCount >= gameData.maxPlayers) {
      throw new Error('Game is full');
    }

    const participantDoc = doc(participantsRef);
    const participant = {
      name,
      deviceId,
      joinedAt: serverTimestamp(),
      order: currentCount + 1,
    };
    transaction.set(participantDoc, participant);

    // Update game status if now full
    if (gameData.maxPlayers && currentCount + 1 >= gameData.maxPlayers) {
      transaction.update(gameRef, { status: 'full' });
    }

    return {
      id: participantDoc.id,
      name,
      deviceId,
      joinedAt: new Date().toISOString(),
      order: currentCount + 1,
    };
  });
}

export function joinGame(gameId: string, name: string, deviceId: string): Promise<Participant> {
  return addParticipantToGame(gameId, name, deviceId);
}

export function addParticipantByHost(gameId: string, name: string): Promise<Participant> {
  return addParticipantToGame(gameId, name, 'host-added');
}

export async function leaveGame(gameId: string, participantId: string): Promise<void> {
  const participantRef = doc(db, GAMES_COLLECTION, gameId, PARTICIPANTS_SUBCOLLECTION, participantId);
  await deleteDoc(participantRef);

  // Update status back to open if was full
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const gameSnap = await getDoc(gameRef);
  if (gameSnap.exists() && gameSnap.data().status === 'full') {
    await updateDoc(gameRef, { status: 'open' });
  }
}

export async function removeParticipant(gameId: string, participantId: string): Promise<void> {
  await deleteDoc(doc(db, GAMES_COLLECTION, gameId, PARTICIPANTS_SUBCOLLECTION, participantId));
}

export function subscribeToParticipants(gameId: string, callback: (participants: Participant[]) => void): Unsubscribe {
  const participantsRef = collection(db, GAMES_COLLECTION, gameId, PARTICIPANTS_SUBCOLLECTION);
  const q = query(participantsRef, orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      joinedAt: d.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Participant));
    callback(participants);
  });
}

export function subscribeToGame(gameId: string, callback: (game: Game | null) => void): Unsubscribe {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  return onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
    } else {
      callback(docToGame(snapshot.id, snapshot.data()));
    }
  });
}

function docToGame(id: string, data: Record<string, unknown>): Game {
  return {
    id,
    hostId: data.hostId as string,
    title: data.title as string,
    venue: data.venue as string,
    date: data.date as string,
    startTime: data.startTime as string,
    endTime: data.endTime as string,
    hours: data.hours as number,
    courts: data.courts as string,
    zone: (data.zone as string) || '',
    maxPlayers: (data.maxPlayers as number) || null,
    status: data.status as Game['status'],
    inviteCode: data.inviteCode as string,
    createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || '',
    gameDate: (data.gameDate as Timestamp)?.toDate?.()?.toISOString() || '',
  };
}
