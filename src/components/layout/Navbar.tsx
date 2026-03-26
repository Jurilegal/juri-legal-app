'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Logo } from './Logo'
import { Button } from '../ui/Button'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-navy-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/anwaelte" className="text-navy-600 hover:text-navy-800 font-medium transition-colors">
              Anwälte finden
            </Link>
            <Link href="/so-funktionierts" className="text-navy-600 hover:text-navy-800 font-medium transition-colors">
              So funktioniert&apos;s
            </Link>
            <Link href="/#preise" className="text-navy-600 hover:text-navy-800 font-medium transition-colors">
              Preise
            </Link>
            <Link href="/#faq" className="text-navy-600 hover:text-navy-800 font-medium transition-colors">
              FAQ
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Kostenlos starten</Button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-navy-600 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/anwaelte" className="block py-2 text-navy-600 font-medium">Anwälte finden</Link>
            <Link href="/#so-funktionierts" className="block py-2 text-navy-600 font-medium">So funktioniert&apos;s</Link>
            <Link href="/#preise" className="block py-2 text-navy-600 font-medium">Preise</Link>
            <Link href="/#faq" className="block py-2 text-navy-600 font-medium">FAQ</Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login"><Button variant="outline" size="sm" className="w-full">Anmelden</Button></Link>
              <Link href="/register"><Button variant="primary" size="sm" className="w-full">Kostenlos starten</Button></Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
