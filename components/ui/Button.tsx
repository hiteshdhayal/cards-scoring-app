'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
