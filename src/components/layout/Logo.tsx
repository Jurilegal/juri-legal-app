import Link from 'next/link'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="w-9 h-9 bg-gradient-to-br from-navy-700 to-navy-900 rounded-lg flex items-center justify-center">
        <span className="text-gold-400 font-bold text-lg">J</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold text-navy-800 tracking-tight">Juri</span>
        <span className="text-xs text-gold-500 font-semibold -mt-1 tracking-wider uppercase">Legal</span>
      </div>
    </Link>
  )
}
