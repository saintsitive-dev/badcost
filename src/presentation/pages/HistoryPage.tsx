import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAllEvents } from '../hooks/useEventData';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { events, refresh, remove } = useAllEvents();

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div>
      <PageHeader title="ประวัติ 📋" subtitle={`เกมทั้งหมด ${events.length} เกม`} />

      {events.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-base">ยังไม่มีประวัติเกม</p>
          <p className="text-sm mt-1">สร้างเกมใหม่จากแท็บ "เกมใหม่"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((ev) => {
            const dateStr = new Date(ev.date).toLocaleDateString('th-TH', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={ev.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => navigate(ev.isFinalized ? `/event/${ev.id}/result` : `/event/${ev.id}`)}
                  className="w-full px-4 py-4 text-left active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{dateStr}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{ev.playerIds.length} คน</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        ev.isFinalized ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ev.isFinalized ? '✓ เสร็จแล้ว' : '● กำลังดำเนินการ'}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/event/${ev.id}`)}
                    className="flex-1 py-2.5 text-sm text-slate-500 active:bg-slate-50"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('ลบเกมนี้?')) remove(ev.id);
                    }}
                    className="flex-1 py-2.5 text-sm text-red-400 active:bg-red-50 border-l border-slate-100"
                  >
                    🗑 ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
