import React from 'react';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  active = false,
  icon,
  children,
  badge,
  variant = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      className={`
        relative group overflow-hidden px-5 py-3 rounded-xl font-semibold text-sm
        transition-all duration-300 ease-out flex items-center justify-center gap-3
        border border-white select-none cursor-pointer
        ${
          active
            ? 'bg-amber-500/25 backdrop-blur-md border-white text-amber-200 shadow-[0_4px_25px_rgba(255,255,255,0.4)] scale-[1.02]'
            : 'bg-zinc-900/90 backdrop-blur-md border-white text-amber-300/90 hover:border-white hover:text-white hover:bg-amber-500/20 hover:shadow-[0_4px_25px_rgba(255,255,255,0.3)] hover:scale-[1.015]'
        }
        ${className}
      `}
    >
      {/* Animated hover shine reflection line */}
      <span
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.18), transparent)'
        }}
      />

      {/* Gold bottom accent line */}
      <span
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] transition-all duration-300 ${
          active
            ? 'w-3/4 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-100 shadow-[0_0_8px_#ffd700]'
            : 'w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80'
        }`}
      />

      {/* Icon with gold glow on active/hover */}
      {icon && (
        <span
          className={`transition-colors duration-300 text-[#FFD700] ${
            active
              ? 'drop-shadow-[0_0_12px_rgba(255,215,0,0.95)]'
              : 'drop-shadow-[0_0_8px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]'
          }`}
        >
          {icon}
        </span>
      )}

      {/* Button Text in Gold */}
      <span
        className={`tracking-wide transition-all duration-300 font-bold text-amber-400 ${
          active
            ? 'drop-shadow-[0_1px_4px_rgba(255,215,0,0.5)] text-amber-300'
            : 'group-hover:text-amber-300'
        }`}
      >
        {children}
      </span>

      {/* Optional count badge */}
      {badge !== undefined && (
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors ${
            active
              ? 'bg-amber-400/25 text-amber-200 border border-amber-400/50'
              : 'bg-zinc-800/80 text-amber-300/70 border border-zinc-700 group-hover:bg-amber-400/20 group-hover:text-amber-200 group-hover:border-amber-400/40'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
