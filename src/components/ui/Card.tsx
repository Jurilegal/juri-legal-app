import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
  return (
    <div onClick={onClick} style={style} className={`bg-white rounded-2xl border border-navy-100 shadow-sm ${hover ? 'hover:shadow-lg hover:border-navy-200 transition-all duration-300' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}
