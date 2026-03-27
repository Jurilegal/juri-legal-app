'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Template { id:string; name:string; content:string; category:string|null; created_at:string }
interface CaseData { id:string; title:string; reference_number:string|null }
interface Contact { id:string; first_name:string; last_name:string; contact_type:string }
interface Settings { kanzlei_name:string|null; kanzlei_strasse:string|null; kanzlei_plz:string|null; kanzlei_ort:string|null }

const PLATZHALTER = [
  { key:'{{MANDANT_NAME}}', desc:'Vor- und Nachname des Mandanten' },
  { key:'{{MANDANT_ADRESSE}}', desc:'Vollständige Anschrift' },
  { key:'{{GEGNER_NAME}}', desc:'Name des Gegners/Gegenpartei' },
  { key:'{{AKTENZEICHEN}}', desc:'Kanzlei-Aktenzeichen' },
  { key:'{{DATUM}}', desc:'Aktuelles Datum (TT.MM.JJJJ)' },
  { key:'{{GERICHT}}', desc:'Zuständiges Gericht' },
  { key:'{{KANZLEI_NAME}}', desc:'Name der Kanzlei' },
  { key:'{{KANZLEI_ADRESSE}}', desc:'Adresse der Kanzlei' },
  { key:'{{ANWALT_NAME}}', desc:'Name des eingeloggten Anwalts' },
]

const DEFAULT_TEMPLATES = [
  { name:'Vollmacht', category:'Allgemein', content:'VOLLMACHT\n\nIch, {{MANDANT_NAME}}, wohnhaft in {{MANDANT_ADRESSE}},\n\nbevollmächtige hiermit\n\n{{ANWALT_NAME}}, {{KANZLEI_NAME}}, {{KANZLEI_ADRESSE}},\n\nmich in der Rechtssache\n\n{{MANDANT_NAME}} ./. {{GEGNER_NAME}}\nAz.: {{AKTENZEICHEN}}\n\nvor allen Gerichten und Behörden zu vertreten.\n\nDie Vollmacht umfasst die Befugnis zur Prozessführung einschließlich aller Nebenverfahren, Zustellungen entgegenzunehmen, Rechtsmittel einzulegen und zurückzunehmen, Vergleiche zu schließen und Geld in Empfang zu nehmen.\n\n{{MANDANT_ADRESSE}}, den {{DATUM}}\n\n_____________________\nUnterschrift Mandant' },
  { name:'Mandatsvertrag', category:'Allgemein', content:'MANDATSVERTRAG\n\nzwischen\n{{MANDANT_NAME}}, {{MANDANT_ADRESSE}}\n— nachfolgend „Mandant" —\n\nund\n{{KANZLEI_NAME}}, {{KANZLEI_ADRESSE}}\nvertreten durch {{ANWALT_NAME}}\n— nachfolgend „Rechtsanwalt" —\n\n§ 1 Gegenstand\nDer Mandant beauftragt den Rechtsanwalt mit der rechtlichen Vertretung in der Angelegenheit:\nAz.: {{AKTENZEICHEN}}\n\n§ 2 Vergütung\nDie Vergütung richtet sich nach dem RVG.\n\n§ 3 Verschwiegenheit\nDer Rechtsanwalt ist zur Verschwiegenheit verpflichtet (§ 43a BRAO).\n\n{{KANZLEI_ADRESSE}}, den {{DATUM}}\n\n_____________________          _____________________\nMandant                              Rechtsanwalt' },
  { name:'Fristsetzung', category:'Schriftsätze', content:'{{KANZLEI_NAME}}\n{{KANZLEI_ADRESSE}}\n\nAn\n{{GEGNER_NAME}}\n\nDatum: {{DATUM}}\nUnser Zeichen: {{AKTENZEICHEN}}\n\nSehr geehrte Damen und Herren,\n\nin vorbezeichneter Angelegenheit unseres Mandanten {{MANDANT_NAME}} setzen wir Ihnen hiermit eine Frist bis zum [FRIST-DATUM],\n\n[FORDERUNG/HANDLUNG]\n\nnachzukommen.\n\nSollte die Frist fruchtlos verstreichen, werden wir ohne weitere Ankündigung gerichtliche Schritte einleiten.\n\nMit freundlichen Grüßen\n{{ANWALT_NAME}}\nRechtsanwalt' },
  { name:'Klageschrift (Deckblatt)', category:'Schriftsätze', content:'An das\n{{GERICHT}}\n\nKLAGESCHRIFT\n\nIn dem Rechtsstreit\n\n{{MANDANT_NAME}}, {{MANDANT_ADRESSE}}\n— Kläger —\n\nProzessbevollmächtigte: {{KANZLEI_NAME}}, {{KANZLEI_ADRESSE}}\n\ngegen\n\n{{GEGNER_NAME}}\n— Beklagter —\n\nwegen: [STREITGEGENSTAND]\nStreitwert: [STREITWERT] EUR\n\nAz.: {{AKTENZEICHEN}}\n\nnamens und in Vollmacht des Klägers erheben wir Klage und beantragen:\n\n1. [ANTRAG]\n\nBegründung:\n[BEGRÜNDUNG]\n\n{{KANZLEI_ADRESSE}}, den {{DATUM}}\n{{ANWALT_NAME}}\nRechtsanwalt' },
  { name:'Abmahnung', category:'Schriftsätze', content:'{{KANZLEI_NAME}}\n{{KANZLEI_ADRESSE}}\n\nPer Einschreiben/Rückschein\nAn {{GEGNER_NAME}}\n\n{{DATUM}}\nAz.: {{AKTENZEICHEN}}\n\nABMAHNUNG\n\nSehr geehrte Damen und Herren,\n\nwir zeigen an, dass wir {{MANDANT_NAME}} rechtlich vertreten.\n\nUnser Mandant hat uns beauftragt, Sie wegen [VERSTOSS] abzumahnen.\n\n[SACHVERHALT]\n\nWir fordern Sie auf, bis zum [FRIST-DATUM]:\n1. [FORDERUNG 1]\n2. Die beigefügte Unterlassungserklärung abzugeben\n\nMit freundlichen Grüßen\n{{ANWALT_NAME}}' },
  { name:'Kostenrechnung', category:'Abrechnung', content:'{{KANZLEI_NAME}}\n{{KANZLEI_ADRESSE}}\n\nAn {{MANDANT_NAME}}\n{{MANDANT_ADRESSE}}\n\nKOSTENRECHNUNG\n\nDatum: {{DATUM}}\nAz.: {{AKTENZEICHEN}}\n\nFür die Vertretung in o.g. Angelegenheit berechnen wir gemäß RVG:\n\n1. Geschäftsgebühr VV 2300 (1,3)     [BETRAG] EUR\n2. Auslagenpauschale VV 7002          20,00 EUR\n3. Umsatzsteuer 19%                   [UST] EUR\n\nGesamt:                               [GESAMT] EUR\n\nZahlbar innerhalb von 14 Tagen.\n\n{{ANWALT_NAME}}\nRechtsanwalt' },
  { name:'Vergleichsangebot', category:'Schriftsätze', content:'{{KANZLEI_NAME}}\n{{KANZLEI_ADRESSE}}\n\n{{DATUM}}\nAz.: {{AKTENZEICHEN}}\n\nSehr geehrte Kollegen,\n\nin vorbezeichneter Angelegenheit {{MANDANT_NAME}} ./. {{GEGNER_NAME}} unterbreiten wir im Namen unseres Mandanten folgenden Vergleichsvorschlag:\n\n1. [VERGLEICHSVORSCHLAG]\n2. Die Kosten des Rechtsstreits werden [KOSTENREGELUNG].\n\nWir bitten um Stellungnahme bis zum [FRIST].\n\nMit kollegialen Grüßen\n{{ANWALT_NAME}}' },
  { name:'Kündigungsschreiben', category:'Arbeitsrecht', content:'{{KANZLEI_NAME}}\n{{KANZLEI_ADRESSE}}\n\nPer Einschreiben/Rückschein und vorab per Boten\n\nAn {{GEGNER_NAME}}\n\n{{DATUM}}\nAz.: {{AKTENZEICHEN}}\n\nSehr geehrte/r [NAME],\n\nim Namen und in Vollmacht unseres Mandanten {{MANDANT_NAME}} kündigen wir hiermit das zwischen Ihnen bestehende Arbeitsverhältnis\n\nordentlich zum nächstmöglichen Termin, das ist nach unserer Berechnung der [DATUM].\n\nHilfsweise kündigen wir zum nächstzulässigen Termin.\n\nBegründung: [KÜNDIGUNGSGRUND]\n\nMit freundlichen Grüßen\n{{ANWALT_NAME}}\nRechtsanwalt' },
]

export default function VorlagenPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template|null>(null)
  const [editContent, setEditContent] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [cases, setCases] = useState<CaseData[]>([])
  const [selectedCase, setSelectedCase] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [settings, setSettings] = useState<Settings|null>(null)
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [toast, setToast] = useState('')
  const [creating, setCreating] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(()=>{load()},[]) // eslint-disable-line

  async function load() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const [tpl, cs, ct, st, prof] = await Promise.all([
      supabase.from('document_templates').select('*').eq('user_id',user.id).order('name'),
      supabase.from('cases').select('id,title,reference_number').eq('user_id',user.id),
      supabase.from('kanzlei_contacts').select('id,first_name,last_name,contact_type').eq('user_id',user.id),
      supabase.from('kanzlei_settings').select('*').eq('user_id',user.id).single(),
      supabase.from('profiles').select('full_name').eq('id',user.id).single(),
    ])
    setTemplates((tpl.data||[]) as Template[])
    setCases((cs.data||[]) as CaseData[])
    setContacts((ct.data||[]) as Contact[])
    if(st.data) setSettings(st.data as Settings)
    if(prof.data) setUserName((prof.data as {full_name:string}).full_name || '')
    setLoading(false)
  }

  function selectTemplate(t:Template) {
    setSelected(t); setEditContent(t.content); setEditName(t.name); setEditCategory(t.category||''); setShowPreview(false); setCreating(false)
  }

  function insertPlaceholder(key:string) {
    setEditContent(prev=>prev+key)
  }

  function generatePreview() {
    let text = editContent
    const c = cases.find(ca=>ca.id===selectedCase)
    const mandant = contacts.find(ct=>ct.contact_type==='mandant')
    const gegner = contacts.find(ct=>ct.contact_type==='gegner')

    text = text.replace(/\{\{MANDANT_NAME\}\}/g, mandant ? `${mandant.first_name} ${mandant.last_name}` : '[Mandant]')
    text = text.replace(/\{\{MANDANT_ADRESSE\}\}/g, '[Adresse Mandant]')
    text = text.replace(/\{\{GEGNER_NAME\}\}/g, gegner ? `${gegner.first_name} ${gegner.last_name}` : '[Gegner]')
    text = text.replace(/\{\{AKTENZEICHEN\}\}/g, c?.reference_number || '[Az.]')
    text = text.replace(/\{\{DATUM\}\}/g, new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}))
    text = text.replace(/\{\{GERICHT\}\}/g, '[Gericht]')
    text = text.replace(/\{\{KANZLEI_NAME\}\}/g, settings?.kanzlei_name || '[Kanzlei]')
    text = text.replace(/\{\{KANZLEI_ADRESSE\}\}/g, settings ? `${settings.kanzlei_strasse||''}, ${settings.kanzlei_plz||''} ${settings.kanzlei_ort||''}` : '[Kanzlei-Adresse]')
    text = text.replace(/\{\{ANWALT_NAME\}\}/g, userName || '[Anwalt]')
    setPreview(text); setShowPreview(true)
  }

  async function saveTemplate() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    if(selected && !creating) {
      await supabase.from('document_templates').update({ name:editName, content:editContent, category:editCategory||null }).eq('id',selected.id)
    } else {
      await supabase.from('document_templates').insert({ user_id:user.id, name:editName, content:editContent, category:editCategory||null })
    }
    setToast('Vorlage gespeichert'); setTimeout(()=>setToast(''),3000)
    setCreating(false); load()
  }

  async function deleteTemplate() {
    if(!selected) return
    await supabase.from('document_templates').delete().eq('id',selected.id)
    setSelected(null); setToast('Vorlage gelöscht'); setTimeout(()=>setToast(''),3000); load()
  }

  async function seedDefaults() {
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    for(const t of DEFAULT_TEMPLATES) {
      await supabase.from('document_templates').insert({ user_id:user.id, name:t.name, content:t.content, category:t.category })
    }
    setToast(`${DEFAULT_TEMPLATES.length} Standard-Vorlagen erstellt`); setTimeout(()=>setToast(''),3000); load()
  }

  function downloadDoc() {
    const text = showPreview ? preview : editContent
    const blob = new Blob([text],{type:'text/plain;charset=utf-8'})
    const a = document.createElement('a')
    a.href=URL.createObjectURL(blob); a.download=`${editName||'Vorlage'}.txt`; a.click()
  }

  const categories = [...new Set(templates.map(t=>t.category).filter(Boolean))]

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg bg-green-500 text-white">{toast}</div>}

      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-navy-800">📝 Dokumenten-Vorlagen</h2><p className="text-sm text-navy-400">Vorlagen mit Platzhaltern erstellen und Dokumente generieren</p></div>
        <div className="flex gap-2">
          {templates.length===0 && <Button variant="secondary" size="sm" onClick={seedDefaults}>📦 Standard-Vorlagen laden</Button>}
          <Button variant="primary" size="sm" onClick={()=>{setCreating(true);setSelected(null);setEditName('');setEditContent('');setEditCategory('');setShowPreview(false)}}>+ Neue Vorlage</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Template list */}
        <div className="space-y-2">
          {templates.length===0 && !creating ? (
            <Card className="p-6 text-center"><p className="text-navy-400 text-sm">Noch keine Vorlagen. Laden Sie die Standard-Vorlagen oder erstellen Sie eine neue.</p></Card>
          ) : templates.map(t=>(
            <button key={t.id} onClick={()=>selectTemplate(t)} className={`w-full text-left p-3 rounded-xl cursor-pointer transition ${selected?.id===t.id&&!creating?'bg-gold-50 border-gold-300 border':'bg-white border border-navy-100 hover:border-gold-200'}`}>
              <p className="text-sm font-medium text-navy-800">{t.name}</p>
              {t.category && <span className="mt-1 inline-block"><Badge variant="neutral">{t.category}</Badge></span>}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-3">
          {(selected || creating) ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Vorlagenname" className="px-3 py-2 rounded-xl border border-navy-200 text-sm"/>
                <input value={editCategory} onChange={e=>setEditCategory(e.target.value)} placeholder="Kategorie (z.B. Schriftsätze)" className="px-3 py-2 rounded-xl border border-navy-200 text-sm" list="cats"/>
                <datalist id="cats">{categories.map(c=><option key={c} value={c!}/>)}</datalist>
              </div>

              {/* Platzhalter Buttons */}
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-navy-500 mr-2 self-center">Platzhalter:</span>
                {PLATZHALTER.map(p=>(
                  <button key={p.key} onClick={()=>insertPlaceholder(p.key)} title={p.desc} className="px-2 py-1 bg-gold-50 text-gold-700 rounded text-[10px] cursor-pointer hover:bg-gold-100 font-mono">{p.key}</button>
                ))}
              </div>

              <textarea value={editContent} onChange={e=>setEditContent(e.target.value)} rows={16} className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm font-mono resize-y"/>

              <div className="flex gap-2 flex-wrap items-center">
                <select value={selectedCase} onChange={e=>setSelectedCase(e.target.value)} className="px-3 py-2 rounded-xl border border-navy-200 text-xs">
                  <option value="">📁 Akte für Vorschau wählen...</option>
                  {cases.map(c=><option key={c.id} value={c.id}>{c.reference_number?`${c.reference_number} — `:''}{c.title}</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={generatePreview}>👁️ Vorschau</Button>
                <Button variant="primary" size="sm" onClick={saveTemplate}>💾 Speichern</Button>
                <Button variant="secondary" size="sm" onClick={downloadDoc}>📥 Download</Button>
                {selected && !creating && <button onClick={deleteTemplate} className="text-xs text-red-500 hover:text-red-700 cursor-pointer ml-2">🗑️ Löschen</button>}
              </div>

              {showPreview && (
                <Card className="p-4 bg-white">
                  <h3 className="text-sm font-semibold text-navy-700 mb-2">Vorschau (Platzhalter ersetzt)</h3>
                  <pre className="text-sm text-navy-700 whitespace-pre-wrap font-sans">{preview}</pre>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center flex flex-col items-center justify-center h-64">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-navy-500">Wählen Sie eine Vorlage oder erstellen Sie eine neue</p>
              <div className="mt-3 text-xs text-navy-400 space-y-1">
                {PLATZHALTER.map(p=><p key={p.key}><code className="bg-navy-50 px-1 rounded font-mono">{p.key}</code> — {p.desc}</p>)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
