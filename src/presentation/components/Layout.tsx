import type { ReactNode } from 'react';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="max-w-md mx-auto px-4 pt-5 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
