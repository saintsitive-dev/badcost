import type { Player } from '../domain/entities/Player';
import type { GameEvent } from '../domain/entities/GameEvent';

interface BackupData {
  version: 1;
  exportedAt: string;
  players: Player[];
  events: GameEvent[];
}

export function exportBackup(players: Player[], events: GameEvent[]): void {
  const data: BackupData = { version: 1, exportedAt: new Date().toISOString(), players, events };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `badcost-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (data.version !== 1 || !Array.isArray(data.players) || !Array.isArray(data.events)) {
          reject(new Error('รูปแบบไฟล์ backup ไม่ถูกต้อง'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsText(file);
  });
}
