import React from 'react';

interface GoldenTextProps {
  children: React.ReactNode;
}

export function GoldenText({ children }: GoldenTextProps) {
  return (
    <span style={{
      color: '#D4AF37',
      textShadow: '0 0 10px rgba(212,175,55,0.6)',
      fontWeight: '700'
    }}>
      {children}
    </span>
  );
}
