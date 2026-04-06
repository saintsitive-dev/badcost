import type { Player } from '../../domain/entities/Player';

interface Props {
  player: Player;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PlayerCard({ player, onToggleFav, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
      <button
        onClick={() => onToggleFav(player.id)}
        className="text-2xl leading-none active:scale-90 transition-transform"
        aria-label={player.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มรายการโปรด'}
      >
        {player.isFavorite ? '⭐' : '☆'}
      </button>
      <span className="flex-1 text-base font-medium text-slate-800 truncate">{player.name}</span>
      <button
        onClick={() => {
          if (confirm(`ลบ "${player.name}" ออกจากรายชื่อ?`)) onDelete(player.id);
        }}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
        aria-label="ลบผู้เล่น"
      >
        🗑
      </button>
    </div>
  );
}
