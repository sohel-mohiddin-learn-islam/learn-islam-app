import React from 'react';

export function IslamicDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center my-8 ${className}`}>
      <div className="h-px bg-border flex-1 max-w-[100px]" />
      <div className="mx-4 text-primary opacity-50 flex gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
      <div className="h-px bg-border flex-1 max-w-[100px]" />
    </div>
  );
}
