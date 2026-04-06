import type { CostBreakdown } from '../entities/CostBreakdown';

/** AC12: format cost breakdown as LINE-shareable text */
export function formatShareText(breakdowns: CostBreakdown[], date: string): string {
  const sorted = [...breakdowns].sort((a, b) => b.total - a.total);
  const dateStr = new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const lines = sorted.map((b, i) => `${i + 1}. ${b.playerName} ${b.total} (${b.hours}hrs)`);
  const grandTotal = sorted.reduce((sum, b) => sum + b.total, 0);
  return ['🏸 สรุปค่าแบด', `📅 ${dateStr}`, '', ...lines, '', `💰 รวม: ${grandTotal} บาท`].join('\n');
}
