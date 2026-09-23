import React from 'react';

interface PoupagaioLogoProps {
  className?: string;
  compact?: boolean;
  alt?: string;
}

/**
 * Componente centralizado para a Logo Principal do Poupagaio Finance.
 * Carrega a imagem pública /branding/poupagaio-logo.png preservando proporção e nitidez.
 */
export function PoupagaioLogo({
  className = '',
  compact = false,
  alt = 'Poupagaio Finance',
}: poupagaio-logooficialProps) {
  const hasCustomHeight = className.split(' ').some((cls) => cls.startsWith('h-'));
  const defaultSize = compact ? 'h-10 sm:h-12' : 'h-14 sm:h-16 md:h-20';
  const sizeClass = hasCustomHeight ? '' : defaultSize;

  return (
    <img
      src="/branding/poupagaio-logooficial.png"
      alt={alt}
      className={`w-auto object-contain shrink-0 ${sizeClass} ${className}`.trim()}
      draggable={false}
    />
  );
}
