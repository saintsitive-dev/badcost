import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export default function PageHeader({ title, subtitle, backTo }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-5">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-600 active:scale-95 transition-transform"
          aria-label="ย้อนกลับ"
        >
          ←
        </button>
      )}
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
