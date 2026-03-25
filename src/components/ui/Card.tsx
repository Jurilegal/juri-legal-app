import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-navy-100 shadow-sm ${hover ? 'hover:shadow-lg hover:border-navy-200 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  )
}
