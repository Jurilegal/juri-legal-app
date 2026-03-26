'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from './Logo'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ items, role, open, onClose }: { items: NavItem[]; role: string; open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-navy-900 text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-navy-800 flex items-center justify-between">
          <Logo className="[&_span]:text-white [&_span:last-child]:text-gold-400" />
          <button onClick={onClose} className="lg:hidden text-navy-400 hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-3 py-2 mt-2">
          <span className="px-3 text-[10px] uppercase tracking-wider text-navy-500 font-semibold">
            {role === 'anwalt' ? 'Anwalt' : role === 'admin' ? 'Admin' : 'Mandant'}
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {items.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-navy-800 text-gold-400'
                    : 'text-navy-300 hover:bg-navy-800/50 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-navy-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-400 hover:bg-navy-800/50 hover:text-white w-full transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Abmelden
          </button>
        </div>
      </aside>
    </>
  )
}
