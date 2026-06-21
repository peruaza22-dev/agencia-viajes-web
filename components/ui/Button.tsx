'use client';

/**
 * Button — componente de botón reutilizable
 *
 * Props:
 *   variant  : 'primary' | 'secondary' | 'outline' | 'ghost' | 'yellow'
 *   size     : 'sm' | 'md' | 'lg'
 *   fullWidth: boolean
 *   disabled : boolean
 *   onClick  : function
 *   type     : 'button' | 'submit' | 'reset'
 *   className: string  (clases extra)
 *   children : ReactNode
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'yellow';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-light text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-primary hover:bg-primary/10',
  yellow: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-5 py-2 text-sm rounded',
  lg: 'px-7 py-3 text-base rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
