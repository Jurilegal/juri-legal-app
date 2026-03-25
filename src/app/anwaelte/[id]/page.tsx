import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SessionRequestButton } from './SessionRequestButton'
import Link from 'next/link'

export default async function LawyerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lawyer } = await supabase
    .from('lawyer_profiles')
    .select('*, profiles(first_name, last_name, avatar_url, email, phone)')
    .eq('user_id', id)
    .eq('verification_status', 'approved')
    .single()

  if (!lawyer) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || null
  }

  const profile = lawyer.profiles as Record<string, string> | null
  const specs = (lawyer.specializations as string[]) || []
  const langs = (lawyer.languages as string[]) || []
  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`
  const isMandant = user && userRole === 'mandant'

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-navy-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar src={profile?.avatar_url} name={fullName} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-navy-900">{fullName}</h1>
                  {lawyer.is_available && <Badge variant="success">Verfügbar</Badge>}
                </div>
                {lawyer.headline && (
                  <p className="text-lg text-navy-500 mt-1">{lawyer.headline}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-navy-400">
                  {lawyer.city && <span>📍 {lawyer.city}</span>}
                  {lawyer.experience_years && <span>🎓 {lawyer.experience_years} Jahre Erfahrung</span>}
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-1">
                    <span className="text-gold-400 text-lg">★</span>
                    <span className="font-bold text-navy-800">{lawyer.rating > 0 ? lawyer.rating : '–'}</span>
                    <span className="text-sm text-navy-400">({lawyer.total_reviews || 0} Bewertungen)</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-navy-800">{lawyer.minute_rate} €</span>
                    <span className="text-navy-400">/min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isMandant ? (
                <SessionRequestButton anwaltId={id} />
              ) : (
                <Link
                  href={user ? '#' : '/register'}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-navy-700 to-navy-800 text-white hover:from-navy-800 hover:to-navy-900 shadow-xl shadow-navy-800/25 transition-all duration-200"
                >
                  Beratung starten
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {lawyer.bio && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-navy-800 mb-3">Über mich</h2>
                  <p className="text-navy-500 leading-relaxed whitespace-pre-wrap">{lawyer.bio}</p>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {specs.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-navy-800 mb-3">Fachgebiete</h2>
                  <div className="flex flex-wrap gap-2">
                    {specs.map(s => (
                      <span key={s} className="px-3 py-1 bg-gold-50 text-gold-700 rounded-lg text-sm font-medium border border-gold-200">{s}</span>
                    ))}
                  </div>
                </Card>
              )}

              {langs.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-navy-800 mb-3">Sprachen</h2>
                  <div className="flex flex-wrap gap-2">
                    {langs.map(l => (
                      <span key={l} className="px-3 py-1 bg-navy-50 text-navy-600 rounded-lg text-sm">{l}</span>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h2 className="text-lg font-bold text-navy-800 mb-3">Statistiken</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Beratungen</span>
                    <span className="font-medium text-navy-700">{lawyer.total_consultations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Bewertungen</span>
                    <span className="font-medium text-navy-700">{lawyer.total_reviews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Minutenpreis</span>
                    <span className="font-bold text-navy-800">{lawyer.minute_rate} €</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
