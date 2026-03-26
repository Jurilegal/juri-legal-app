import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Juri Legal | Sofortige Rechtsberatung per Minute',
  description: 'Verbinden Sie sich sofort mit verifizierten Anwälten. Transparente Minutenabrechnung. Keine versteckten Kosten. DSGVO-konform und SSL-verschlüsselt.',
  keywords: 'Rechtsberatung, Anwalt, Online Anwalt, Rechtsanwalt, Beratung per Minute, Juri Legal',
  openGraph: {
    title: 'Juri Legal | Sofortige Rechtsberatung per Minute',
    description: 'Verbinden Sie sich sofort mit verifizierten Anwälten. Transparente Minutenabrechnung.',
    type: 'website',
    locale: 'de_DE',
  },
}

import { CookieBanner } from '@/components/CookieBanner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-navy-800 antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
