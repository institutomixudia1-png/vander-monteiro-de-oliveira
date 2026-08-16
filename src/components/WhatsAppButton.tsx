import React from 'react';
import { openWhatsApp } from '../utils/whatsapp';

interface WhatsAppButtonProps {
  phone?: string;
  companyName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.507 14.301c-.372-.186-2.203-1.087-2.545-1.21-.342-.124-.591-.186-.84.186-.248.372-.962 1.21-1.18 1.458-.218.248-.435.279-.807.093-.372-.186-1.571-.579-2.993-1.847-1.106-.988-1.854-2.208-2.071-2.58-.217-.372-.023-.573.163-.758.168-.168.372-.435.559-.652.186-.217.248-.372.372-.621.124-.248.062-.465-.031-.652-.093-.186-.84-2.022-1.15-2.766-.302-.724-.61-.626-.84-.638l-.715-.013c-.248 0-.652.093-.992.465-.341.372-1.302 1.272-1.302 3.104 0 1.832 1.333 3.601 1.519 3.849.186.248 2.622 4.004 6.353 5.614.887.383 1.58.612 2.12.783.891.283 1.702.243 2.343.147.715-.107 2.203-.901 2.513-1.769.31-.868.31-1.613.217-1.769-.093-.155-.341-.248-.713-.434z" />
    <path d="M12.004 2c-5.514 0-10 4.486-10 10 0 1.831.493 3.549 1.353 5.033L2 22l5.101-1.339A9.94 9.94 0 0 0 12.004 22c5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.2c-1.542 0-3.003-.418-4.269-1.147l-.306-.182-3.17.832.846-3.091-.199-.317A8.15 8.15 0 0 1 3.804 12c0-4.52 3.68-8.2 8.2-8.2 4.52 0 8.2 3.68 8.2 8.2 0 4.52-3.68 8.2-8.2 8.2z" />
  </svg>
);

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  companyName,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openWhatsApp(phone, companyName);
      }}
      className={`rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-[#FFD700] flex items-center justify-center shadow-[0_0_12px_rgba(255,215,0,0.35)] hover:shadow-[0_0_18px_rgba(255,215,0,0.65)] hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0 border border-amber-400/70 hover:border-amber-300 ${sizeClasses[size]} ${className}`}
      title={`Abrir WhatsApp Web (${phone || 'Sem telefone'})`}
    >
      <WhatsAppIcon className={`${iconSizes[size]} text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.8)]`} />
    </button>
  );
};
