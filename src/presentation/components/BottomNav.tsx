import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',        label: 'ผู้เล่น',  icon: '👥' },
  { to: '/new',     label: 'เกมใหม่',  icon: '🏸' },
  { to: '/history', label: 'ประวัติ',  icon: '📋' },
  { to: '/settings',label: 'ตั้งค่า',  icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-green-600' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
