export interface Game {
  id: string;
  hostId: string;
  title: string;
  venue: string;
  date: string;           // ISO date "2026-05-20"
  startTime: string;      // "19:00"
  endTime: string;        // "20:00"
  hours: number;
  courts: string;         // e.g. "4,5 คอร์ด"
  zone: string;           // e.g. "3,4,5" (optional)
  maxPlayers: number | null;
  status: 'open' | 'full' | 'closed';
  inviteCode: string;
  createdAt: string;      // ISO timestamp
  gameDate: string;       // ISO timestamp for querying
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;       // ISO timestamp
  deviceId: string;
  order: number;          // for ordering in the list
}

export function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function isGameVisible(game: Game): boolean {
  const now = new Date();
  const gameDate = new Date(game.gameDate);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Hide past games older than 1 week
  if (gameDate < oneWeekAgo) return false;

  return true;
}

export function isGameFull(game: Game, participantCount: number): boolean {
  if (game.maxPlayers === null) return false;
  return participantCount >= game.maxPlayers;
}

export function formatGameDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = [
    'มกรา', 'กุมภา', 'มีนา', 'เมษา', 'พฤษภา', 'มิถุนา',
    'กรกฎา', 'สิงหา', 'กันยา', 'ตุลา', 'พฤศจิกา', 'ธันวา',
  ];
  const day = days[date.getDay()];
  const d = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${d} ${month} ${year}`;
}
