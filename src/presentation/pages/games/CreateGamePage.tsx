import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../../infrastructure/repositories/FirestoreGameRepo';
import { getCurrentUser } from '../../../infrastructure/firebase';
import { GamePageContainer, Card, PrimaryButton } from '../../components/games';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: 'เปิดตี้ 🏸',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    hours: 2,
    courts: '',
    zone: '',
    maxPlayers: '' as string | number,
  });

  function updateField(field: string, value: string | number) {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        const start = parseTime(field === 'startTime' ? value as string : prev.startTime);
        const end = parseTime(field === 'endTime' ? value as string : prev.endTime);
        if (start !== null && end !== null && end > start) {
          updated.hours = end - start;
        }
      }
      return updated;
    });
  }

  function parseTime(timeStr: string): number | null {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      navigate('/games/login');
      return;
    }

    setLoading(true);
    try {
      const game = await createGame(user.uid, {
        title: form.title,
        venue: form.venue,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        hours: form.hours,
        courts: form.courts,
        zone: form.zone,
        maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : null,
        gameDate: new Date(`${form.date}T${form.startTime}`).toISOString(),
      });
      navigate(`/games/${game.id}`, { state: { showCopyLink: true } });
    } catch (err) {
      console.error('Failed to create game:', err);
      alert('สร้างเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GamePageContainer>
      <button
        onClick={() => navigate('/games/manage')}
        className="text-sm text-slate-500 mb-3 flex items-center gap-1 active:text-slate-700"
      >
        ← กลับหน้ารายการ
      </button>
      <h1 className="text-xl font-bold text-slate-800 mb-4">🏸 สร้างเกมใหม่</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="ชื่อเกม">
            <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} className="form-input" required />
          </FormField>

          <FormField label="สนาม">
            <input type="text" value={form.venue} onChange={e => updateField('venue', e.target.value)} placeholder="e.g. sevendays badminton" className="form-input" required />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="วันที่เล่น">
              <input type="date" value={form.date} onChange={e => updateField('date', e.target.value)} className="form-input" required />
            </FormField>
            <FormField label="จำนวนชั่วโมง">
              <input type="number" value={form.hours} onChange={e => updateField('hours', Number(e.target.value))} min={1} className="form-input" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="เวลาเริ่ม">
              <input type="time" value={form.startTime} onChange={e => updateField('startTime', e.target.value)} className="form-input" required />
            </FormField>
            <FormField label="เวลาจบ">
              <input type="time" value={form.endTime} onChange={e => updateField('endTime', e.target.value)} className="form-input" required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="คอร์ด">
              <input type="text" value={form.courts} onChange={e => updateField('courts', e.target.value)} placeholder="e.g. 3 คอร์ด" className="form-input" />
            </FormField>
            <FormField label="โซน">
              <input type="text" value={form.zone} onChange={e => updateField('zone', e.target.value)} placeholder="e.g. 3,4,5" className="form-input" />
            </FormField>
          </div>

          <FormField label="จำนวนคนสูงสุด (ว่าง = ไม่จำกัด)">
            <input type="number" value={form.maxPlayers} onChange={e => updateField('maxPlayers', e.target.value)} placeholder="ไม่จำกัด" min={1} className="form-input" />
          </FormField>

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'กำลังสร้าง...' : '✨ สร้างเกม'}
          </PrimaryButton>
        </form>
      </Card>
    </GamePageContainer>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
