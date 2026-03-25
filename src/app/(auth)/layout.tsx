import { Logo } from '@/components/layout/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-gold-50/30 flex flex-col">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
