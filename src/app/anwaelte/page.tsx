import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export const metadata = {
  title: 'Anwälte finden | Juri Legal',
  description: 'Durchsuchen Sie unser Netzwerk verifizierter Anwälte. Sofortige Rechtsberatung per Minute.',
}

export default async function AnwaeltePage({ searchParams }: { searchParams: Promise<{ fach?: string; stadt?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('lawyer_profiles')
    .select('*, profiles(first_name, last_name, avatar_url, email)')
    .eq('verification_status', 'approved')

  if (params.fach) {
    query = query.contains('specializations', [params.fach])
  }
  if (params.stadt) {
    query = query.ilike('city', `%${params.stadt}%`)
  }

  const { data: lawyers } = await query.order('rating', { ascending: false })

  const fachgebiete = [
    'Arbeitsrecht', 'Familienrecht', 'Mietrecht', 'Verkehrsrecht',
    'Strafrecht', 'Erbrecht', 'Vertragsrecht', 'Sozialrecht',
  ]

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-navy-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-navy-900">Anwälte finden</h1>
            <p className="text-navy-400 mt-2 text-lg">Durchsuchen Sie unser Netzwerk verifizierter Rechtsanwälte</p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/anwaelte"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!params.fach ? 'bg-navy-800 text-white' : 'bg-white text-navy-500 border border-navy-200 hover:border-navy-300'}`}
            >
              Alle
            </Link>
            {fachgebiete.map(f => (
              <Link
                key={f}
                href={`/anwaelte?fach=${encodeURIComponent(f)}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${params.fach === f ? 'bg-navy-800 text-white' : 'bg-white text-navy-500 border border-navy-200 hover:border-navy-300'}`}
              >
                {f}
              </Link>
            ))}
          </div>

          {/* Results */}
          {!lawyers || lawyers.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-navy-400 text-lg">Keine Anwälte gefunden. Versuchen Sie andere Filterkriterien.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lawyers.map((l) => {
                const lawyer = l as { id: string; user_id: string; headline: string | null; is_available: boolean; city: string | null; specializations: string[]; rating: number; total_reviews: number; minute_rate: string; profiles: { first_name: string; last_name: string; avatar_url: string | null } | null }
                const profile = lawyer.profiles
                const specs = lawyer.specializations || []
                return (
                  <Link key={lawyer.id} href={`/anwaelte/${lawyer.user_id}`}>
                    <Card hover className="p-6 h-full">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={profile?.avatar_url}
                          name={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-navy-800 truncate">
                            {profile?.first_name} {profile?.last_name}
                          </h3>
                          {lawyer.headline && (
                            <p className="text-sm text-navy-400 truncate mt-0.5">{lawyer.headline}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {lawyer.is_available && (
                              <Badge variant="success">Verfügbar</Badge>
                            )}
                            {lawyer.city && (
                              <span className="text-xs text-navy-400">📍 {lawyer.city}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {specs.slice(0, 3).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-navy-50 text-navy-500 rounded text-xs">{s}</span>
                          ))}
                          {specs.length > 3 && (
                            <span className="px-2 py-0.5 bg-navy-50 text-navy-400 rounded text-xs">+{specs.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-100">
                        <div className="flex items-center gap-1">
                          <span className="text-gold-400">★</span>
                          <span className="text-sm font-medium text-navy-700">{lawyer.rating > 0 ? String(lawyer.rating) : '–'}</span>
                          <span className="text-xs text-navy-400">({lawyer.total_reviews || 0})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-navy-800">{lawyer.minute_rate} €</span>
                          <span className="text-xs text-navy-400">/min</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
