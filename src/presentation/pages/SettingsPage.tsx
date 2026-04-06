import { useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import { useAllEvents } from '../hooks/useEventData';
import { LocalStoragePlayerRepo } from '../../infrastructure/repositories/LocalStoragePlayerRepo';
import { LocalStorageEventRepo } from '../../infrastructure/repositories/LocalStorageEventRepo';
import { exportBackup, importBackup } from '../../infrastructure/backup';

const playerRepo = new LocalStoragePlayerRepo();
const eventRepo = new LocalStorageEventRepo();

export default function SettingsPage() {
  const { players, sortedPlayers } = usePlayers();
  const { events } = useAllEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    exportBackup(players, events);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBackup(file);
      if (!confirm(`นำเข้า ${data.players.length} ผู้เล่น และ ${data.events.length} เกม?\n\n⚠️ ข้อมูลปัจจุบันจะถูกแทนที่`)) return;
      playerRepo.save(data.players);
      data.events.forEach((ev) => eventRepo.save(ev));
      alert('นำเข้าสำเร็จ! กรุณารีเฟรชแอป');
      window.location.reload();
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <PageHeader title="ตั้งค่า ⚙️" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{sortedPlayers.length}</p>
          <p className="text-sm text-slate-500 mt-1">ผู้เล่น</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{events.length}</p>
          <p className="text-sm text-slate-500 mt-1">เกมทั้งหมด</p>
        </div>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 bg-green-50 border-b border-green-100">
          <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide">💾 สำรองข้อมูล</h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          <button
            onClick={handleExport}
            className="w-full h-12 bg-green-600 text-white rounded-2xl font-semibold text-base active:scale-95 transition-transform shadow-sm"
          >
            ⬇️ Export ข้อมูล (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12 border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold text-base active:scale-95 transition-transform"
          >
            ⬆️ Import ข้อมูล (JSON)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <p className="text-xs text-slate-400 text-center">
            บันทึกไฟล์ไว้ใน Google Drive เพื่อสำรองข้อมูล
          </p>
        </div>
      </div>

      {/* App info */}
      <div className="text-center text-xs text-slate-400 mt-6">
        <p>BadCost 🏸 v1.0.0</p>
        <p className="mt-0.5">ข้อมูลเก็บใน LocalStorage ของเบราว์เซอร์</p>
      </div>
    </div>
  );
}
