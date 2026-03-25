interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export function Avatar({ src, name = '?', size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  if (src) {
    return (
      <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover border-2 border-navy-100`} />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white font-semibold border-2 border-navy-100`}>
      {initials}
    </div>
  )
}
