'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type ImportTarget = 'cases'|'kanzlei_contacts'|'kanzlei_clients'|'deadlines'
interface MappingField { csv:string; db:string }

const TARGET_FIELDS: Record<ImportTarget, {key:string;label:string;required?:boolean}[]> = {
  cases: [{key:'title',label:'Titel',required:true},{key:'reference_number',label:'Aktenzeichen'},{key:'legal_area',label:'Rechtsgebiet'},{key:'status',label:'Status'},{key:'description',label:'Beschreibung'}],
  kanzlei_contacts: [{key:'first_name',label:'Vorname',required:true},{key:'last_name',label:'Nachname',required:true},{key:'contact_type',label:'Typ'},{key:'email',label:'E-Mail'},{key:'phone',label:'Telefon'},{key:'company',label:'Firma'},{key:'street',label:'Straße'},{key:'zip',label:'PLZ'},{key:'city',label:'Ort'}],
  kanzlei_clients: [{key:'first_name',label:'Vorname',required:true},{key:'last_name',label:'Nachname',required:true},{key:'email',label:'E-Mail'},{key:'phone',label:'Telefon'},{key:'client_type',label:'Typ (privat/geschäftlich)'},{key:'company',label:'Firma'}],
  deadlines: [{key:'title',label:'Titel',required:true},{key:'due_date',label:'Fälligkeitsdatum',required:true},{key:'priority',label:'Priorität'},{key:'description',label:'Beschreibung'}],
}

const TARGET_LABELS: Record<ImportTarget,string> = { cases:'Akten', kanzlei_contacts:'Kontakte', kanzlei_clients:'Mandanten', deadlines:'Fristen' }

export default function MigrationPage() {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File|null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [target, setTarget] = useState<ImportTarget>('cases')
  const [mapping, setMapping] = useState<MappingField[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{success:number;errors:string[]}>({success:0,errors:[]})
  const [toast, setToast] = useState('')

  function parseCSV(text:string) {
    const lines = text.split('\n').filter(l=>l.trim())
    if(lines.length<2) return
    const sep = lines[0].includes(';')?';':','
    const headers = lines[0].split(sep).map(h=>h.replace(/"/g,'').trim())
    const rows = lines.slice(1).map(l=>l.split(sep).map(c=>c.replace(/"/g,'').trim()))
    setCsvHeaders(headers); setCsvRows(rows)
    // Auto-map
    const fields = TARGET_FIELDS[target]
    const autoMap:MappingField[] = fields.map(f=>{
      const match = headers.find(h=>h.toLowerCase().includes(f.key.replace('_',' '))||h.toLowerCase()===f.key||h.toLowerCase()===f.label.toLowerCase())
      return { csv:match||'', db:f.key }
    })
    setMapping(autoMap)
    setStep(3)
  }

  async function handleFile(f:File) {
    setFile(f)
    const text = await f.text()
    parseCSV(text)
  }

  async function doImport() {
    setImporting(true); setProgress(0)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    let success=0; const errors:string[]=[]

    for(let i=0;i<csvRows.length;i++) {
      const row = csvRows[i]
      const record: Record<string,string> = {}
      for(const m of mapping) {
        if(!m.csv) continue
        const colIdx = csvHeaders.indexOf(m.csv)
        if(colIdx>=0 && row[colIdx]) record[m.db] = row[colIdx]
      }

      // Validate required
      const reqFields = TARGET_FIELDS[target].filter(f=>f.required)
      const missing = reqFields.filter(f=>!record[f.key])
      if(missing.length) { errors.push(`Zeile ${i+2}: ${missing.map(f=>f.label).join(', ')} fehlt`); continue }

      // Insert
      const insertData = { ...record, user_id:user.id } as Record<string,string>
      if(target==='cases') { insertData.status = insertData.status || 'active' }
      if(target==='deadlines') { insertData.status = insertData.status || 'offen' }

      const { error } = await supabase.from(target).insert(insertData)
      if(error) errors.push(`Zeile ${i+2}: ${error.message}`)
      else success++
      setProgress(Math.round(((i+1)/csvRows.length)*100))
    }
    setResult({success,errors}); setStep(5); setImporting(false)
  }

  function downloadTemplate() {
    const fields = TARGET_FIELDS[target]
    const csv = fields.map(f=>f.label).join(';')+'\n'
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Vorlage-${TARGET_LABELS[target]}.csv`; a.click()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm bg-green-500 text-white rounded shadow-lg">{toast}</div>}

      <div><h2 className="text-xl font-bold text-navy-800">📦 Daten-Migration</h2><p className="text-sm text-navy-400">Importieren Sie Daten aus Ihrer bisherigen Kanzleisoftware</p></div>

      {/* Steps */}
      <div className="flex gap-2">
        {[{n:1,l:'Ziel wählen'},{n:2,l:'CSV hochladen'},{n:3,l:'Zuordnung'},{n:4,l:'Import'},{n:5,l:'Ergebnis'}].map(s=>(
          <div key={s.n} className={`flex-1 py-2 text-center text-xs rounded-xl ${step>=s.n?'bg-navy-800 text-white':'bg-navy-100 text-navy-400'}`}>{s.n}. {s.l}</div>
        ))}
      </div>

      {/* Step 1: Target */}
      {step===1 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Was möchten Sie importieren?</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(TARGET_LABELS) as ImportTarget[]).map(t=>(
              <button key={t} onClick={()=>setTarget(t)} className={`p-4 rounded-xl border cursor-pointer text-left ${target===t?'border-gold-400 bg-gold-50':'border-navy-100 hover:border-gold-200'}`}>
                <p className="font-medium text-navy-800">{TARGET_LABELS[t]}</p>
                <p className="text-xs text-navy-400">{TARGET_FIELDS[t].length} Felder</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={()=>setStep(2)}>Weiter →</Button>
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>📥 CSV-Vorlage herunterladen</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Upload */}
      {step===2 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">CSV-Datei hochladen</h3>
          <div className="border-2 border-dashed border-navy-200 rounded-xl p-8 text-center">
            <input type="file" accept=".csv,.txt" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0])}} className="hidden" id="csv-upload"/>
            <label htmlFor="csv-upload" className="cursor-pointer">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-navy-600">{file?file.name:'CSV-Datei auswählen'}</p>
              <p className="text-xs text-navy-400 mt-1">Unterstützt: CSV (Komma- oder Semikolon-getrennt)</p>
            </label>
          </div>
          <Button variant="secondary" size="sm" onClick={()=>setStep(1)}>← Zurück</Button>
        </Card>
      )}

      {/* Step 3: Mapping */}
      {step===3 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Spalten zuordnen</h3>
          <p className="text-xs text-navy-400">Erkannte Spalten: {csvHeaders.join(', ')} · {csvRows.length} Datensätze</p>
          <div className="space-y-2">
            {TARGET_FIELDS[target].map(f=>(
              <div key={f.key} className="flex items-center gap-3">
                <label className="w-40 text-sm text-navy-700">{f.label}{f.required?<span className="text-red-500"> *</span>:''}</label>
                <select value={mapping.find(m=>m.db===f.key)?.csv||''} onChange={e=>setMapping(prev=>prev.map(m=>m.db===f.key?{...m,csv:e.target.value}:m))} className="flex-1 px-3 py-2 rounded-xl border border-navy-200 text-sm">
                  <option value="">— nicht zuordnen —</option>
                  {csvHeaders.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="overflow-x-auto">
            <p className="text-xs font-medium text-navy-500 mb-1">Vorschau (erste 5 Zeilen)</p>
            <table className="w-full text-xs"><thead><tr>{csvHeaders.map(h=><th key={h} className="p-2 text-left bg-navy-50 text-navy-600">{h}</th>)}</tr></thead>
              <tbody>{csvRows.slice(0,5).map((r,i)=><tr key={i} className="border-b border-navy-50">{r.map((c,j)=><td key={j} className="p-2 text-navy-700">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={()=>setStep(4)}>Weiter →</Button>
            <Button variant="secondary" size="sm" onClick={()=>setStep(2)}>← Zurück</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirm + Import */}
      {step===4 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Import bestätigen</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-navy-50 rounded-xl"><p className="text-xs text-navy-400">Ziel</p><p className="font-medium text-navy-800">{TARGET_LABELS[target]}</p></div>
            <div className="p-3 bg-navy-50 rounded-xl"><p className="text-xs text-navy-400">Datensätze</p><p className="font-medium text-navy-800">{csvRows.length}</p></div>
          </div>
          {importing && (
            <div><div className="w-full bg-navy-100 rounded-full h-3"><div className="bg-gold-500 h-3 rounded-full transition-all" style={{width:progress+'%'}}/></div><p className="text-xs text-navy-500 text-center mt-1">{progress}%</p></div>
          )}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={doImport} loading={importing} disabled={importing}>🚀 Import starten</Button>
            {!importing && <Button variant="secondary" size="sm" onClick={()=>setStep(3)}>← Zurück</Button>}
          </div>
        </Card>
      )}

      {/* Step 5: Result */}
      {step===5 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-navy-800">Import abgeschlossen</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 rounded-xl"><p className="text-xs text-green-600">Erfolgreich</p><p className="text-2xl font-bold text-green-700">{result.success}</p></div>
            <div className="p-4 bg-red-50 rounded-xl"><p className="text-xs text-red-600">Fehler</p><p className="text-2xl font-bold text-red-700">{result.errors.length}</p></div>
          </div>
          {result.errors.length>0 && (
            <div className="max-h-40 overflow-y-auto bg-red-50 rounded-xl p-3 space-y-1">
              {result.errors.map((e,i)=><p key={i} className="text-xs text-red-700">{e}</p>)}
            </div>
          )}
          <Button variant="primary" size="sm" onClick={()=>{setStep(1);setCsvHeaders([]);setCsvRows([]);setFile(null);setResult({success:0,errors:[]})}}>Neuer Import</Button>
        </Card>
      )}
    </div>
  )
}
