'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-navy-700 to-navy-800 text-white hover:from-navy-800 hover:to-navy-900 shadow-lg shadow-navy-800/25',
  secondary: 'bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 hover:from-gold-500 hover:to-gold-600 shadow-lg shadow-gold-400/25',
  outline: 'border-2 border-navy-300 text-navy-700 hover:bg-navy-50 hover:border-navy-400',
  ghost: 'text-navy-600 hover:bg-navy-50 hover:text-navy-800',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({ variant = 'primary', size = 'md', children, loading, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
