import type { ReactNode } from 'react';

/**
 * Content container for game booking pages.
 * Layout provides the outer chrome (background, padding, bottom nav).
 */
export function GamePageContainer({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={`w-full ${centered ? 'flex items-center justify-center min-h-[60vh]' : ''}`}>
      {children}
    </div>
  );
}

/**
 * White card panel used throughout game pages.
 */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Loading spinner shown while pages/data load.
 */
export function LoadingScreen() {
  return (
    <GamePageContainer centered>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-400">กำลังโหลด...</p>
      </div>
    </GamePageContainer>
  );
}

/**
 * Empty/error state with emoji and message.
 */
export function EmptyState({ emoji = '🏸', title, subtitle }: { emoji?: string; title: string; subtitle?: string }) {
  return (
    <GamePageContainer centered>
      <Card className="text-center max-w-sm mx-auto">
        <div className="text-4xl mb-3">{emoji}</div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-2">{subtitle}</p>}
      </Card>
    </GamePageContainer>
  );
}

/**
 * Primary action button (emerald, full-width).
 */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-emerald-500 text-white font-medium rounded-xl py-3 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

/**
 * Secondary/outline button.
 */
export function SecondaryButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-slate-100 text-slate-600 font-medium rounded-xl py-3 hover:bg-slate-200 active:scale-[0.98] transition ${className}`}
    >
      {children}
    </button>
  );
}
