'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface CalEvent { id:string; title:string; description:string|null; event_type:string; start_time:string; end_time:string|null; all_day:boolean; case_id:string|null; location:string|null; color:string; reminder_minutes:number }
interface Deadline { id:string; title:string; due_date:string; status:string; priority:string; type:string }

type View = 'month'|'week'|'day'

const WEEKDAYS = ['Mo','Di','Mi','Do','Fr','Sa','So']
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const EVENT_TYPES = [{value:'termin',label:'Termin',color:'#D4A843'},{value:'gerichtstermin',label:'Gerichtstermin',color:'#DC2626'},{value:'besprechung',label:'Besprechung',color:'#2563EB'},{value:'telefonat',label:'Telefonat',color:'#059669'},{value:'privat',label:'Privat',color:'#8B5CF6'}]

// Deutsche Feiertage
function getHolidays(year:number, bundesland='NRW') {
  const easter = computeEaster(year)
  const holidays:Record<string,string> = {
    [`${year}-01-01`]:'Neujahr', [`${year}-05-01`]:'Tag der Arbeit', [`${year}-10-03`]:'Tag der Deutschen Einheit',
    [`${year}-12-25`]:'1. Weihnachtsfeiertag', [`${year}-12-26`]:'2. Weihnachtsfeiertag',
  }
  const addDays = (d:Date,n:number) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString().split('T')[0] }
  holidays[addDays(easter,-2)]='Karfreitag'; holidays[addDays(easter,1)]='Ostermontag'
  holidays[addDays(easter,39)]='Christi Himmelfahrt'; holidays[addDays(easter,50)]='Pfingstmontag'
  if(['BW','BY','HE','NRW','RP','SL'].includes(bundesland)) holidays[addDays(easter,60)]='Fronleichnam'
  if(['BW','BY','SL'].includes(bundesland)) holidays[`${year}-08-15`]='Mariä Himmelfahrt'
  if(['BB','MV','SN','ST','TH'].includes(bundesland)) holidays[`${year}-10-31`]='Reformationstag'
  if(['BW','BY','NRW','RP','SL'].includes(bundesland)) holidays[`${year}-11-01`]='Allerheiligen'
  return holidays
}
function computeEaster(year:number):Date {
  const a=year%19, b=Math.floor(year/100), c=year%100, d=Math.floor(b/4), e=b%4
  const f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3), h=(19*a+b-d-g+15)%30
  const i=Math.floor(c/4), k=c%4, l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451)
  const month=Math.floor((h+l-7*m+114)/31), day=((h+l-7*m+114)%31)+1
  return new Date(year, month-1, day)
}

export default function KalenderPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [cases, setCases] = useState<{id:string;title:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', event_type:'termin', start_date:'', start_time:'09:00', end_time:'10:00', all_day:false, case_id:'', location:'', reminder_minutes:'60' })
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string|null>(null)

  const holidays = useMemo(()=>getHolidays(currentDate.getFullYear()), [currentDate])

  useEffect(()=>{load()}, [currentDate]) // eslint-disable-line react-hooks/exhaustive-deps
  async function load() {
    setLoading(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const [r1,r2,r3] = await Promise.all([
      supabase.from('calendar_events').select('*').eq('user_id',user.id).order('start_time'),
      supabase.from('deadlines').select('id,title,due_date,status,priority,type').eq('user_id',user.id),
      supabase.from('cases').select('id,title').eq('user_id',user.id),
    ])
    setEvents((r1.data||[]) as CalEvent[]); setDeadlines((r2.data||[]) as Deadline[]); setCases((r3.data||[]) as {id:string;title:string}[])
    setLoading(false)
  }
  async function createEvent() {
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const startTime = form.all_day ? `${form.start_date}T00:00:00` : `${form.start_date}T${form.start_time}:00`
    const endTime = form.all_day ? null : `${form.start_date}T${form.end_time}:00`
    const color = EVENT_TYPES.find(t=>t.value===form.event_type)?.color || '#D4A843'
    await supabase.from('calendar_events').insert({
      user_id:user.id, title:form.title, description:form.description||null, event_type:form.event_type,
      start_time:startTime, end_time:endTime, all_day:form.all_day, case_id:form.case_id||null,
      location:form.location||null, color, reminder_minutes:parseInt(form.reminder_minutes)||60
    })
    setForm({title:'',description:'',event_type:'termin',start_date:'',start_time:'09:00',end_time:'10:00',all_day:false,case_id:'',location:'',reminder_minutes:'60'})
    setShowForm(false); setSaving(false); load()
  }

  // Calendar helpers
  const year = currentDate.getFullYear(), month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month+1, 0)
  const startWeekday = (firstDay.getDay()+6)%7 // Monday = 0
  const daysInMonth = lastDay.getDate()
  const today = new Date().toISOString().split('T')[0]

  function getEventsForDate(dateStr:string) {
    return events.filter(e => e.start_time.startsWith(dateStr))
  }
  function getDeadlinesForDate(dateStr:string) {
    return deadlines.filter(d => d.due_date === dateStr && d.status !== 'done')
  }

  function navigate(dir:number) {
    const d = new Date(currentDate)
    if(view==='month') d.setMonth(d.getMonth()+dir)
    else if(view==='week') d.setDate(d.getDate()+dir*7)
    else d.setDate(d.getDate()+dir)
    setCurrentDate(d)
  }

  // Day detail view
  if(selectedDay) {
    const dayEvents = getEventsForDate(selectedDay)
    const dayDeadlines = getDeadlinesForDate(selectedDay)
    const holiday = holidays[selectedDay]
    const d = new Date(selectedDay)
    return (
      <div className="space-y-4">
        <button onClick={()=>setSelectedDay(null)} className="text-sm text-navy-400 hover:text-navy-600 cursor-pointer">← Kalender</button>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-800">{d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h2>
          <Button variant="primary" size="sm" onClick={()=>{setForm(f=>({...f,start_date:selectedDay}));setShowForm(true)}}>+ Termin</Button>
        </div>
        {holiday && <Card className="p-3 bg-red-50 border-red-200"><span className="text-sm text-red-700">🎉 {holiday}</span></Card>}
        {showForm && renderForm()}
        {dayEvents.length===0 && dayDeadlines.length===0 && !showForm && <Card className="p-8 text-center"><p className="text-navy-400">Keine Einträge an diesem Tag.</p></Card>}
        {dayDeadlines.map(dl=>(
          <Card key={dl.id} className="p-4 border-l-4 border-red-400">
            <div className="flex items-center gap-2"><Badge variant={dl.priority==='high'||dl.priority==='urgent'?'error':'warning'}>{dl.type==='wiedervorlage'?'WV':'Frist'}</Badge><span className="font-medium text-navy-800">{dl.title}</span></div>
          </Card>
        ))}
        {dayEvents.map(ev=>(
          <Card key={ev.id} className="p-4" style={{borderLeft:`4px solid ${ev.color}`}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-800">{ev.title}</p>
                <p className="text-xs text-navy-400">{ev.all_day?'Ganztägig':`${new Date(ev.start_time).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} - ${ev.end_time?new Date(ev.end_time).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):''}`}</p>
                {ev.location && <p className="text-xs text-navy-400">📍 {ev.location}</p>}
              </div>
              <Badge variant="neutral">{EVENT_TYPES.find(t=>t.value===ev.event_type)?.label||ev.event_type}</Badge>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  function renderForm() {
    return (
      <Card className="p-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Titel *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          <div><label className="text-sm text-navy-400 block mb-1">Typ</label>
            <select value={form.event_type} onChange={e=>setForm(f=>({...f,event_type:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              {EVENT_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <Input label="Datum *" type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/>
          <div><label className="flex items-center gap-2 text-sm text-navy-400 mb-1"><input type="checkbox" checked={form.all_day} onChange={e=>setForm(f=>({...f,all_day:e.target.checked}))}/> Ganztägig</label></div>
          {!form.all_day && <><Input label="Von" type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))}/><Input label="Bis" type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))}/></>}
          <Input label="Ort" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
          <div><label className="text-sm text-navy-400 block mb-1">Akte (optional)</label>
            <select value={form.case_id} onChange={e=>setForm(f=>({...f,case_id:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="">Keine</option>{cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
            </select></div>
          <div><label className="text-sm text-navy-400 block mb-1">Erinnerung</label>
            <select value={form.reminder_minutes} onChange={e=>setForm(f=>({...f,reminder_minutes:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm">
              <option value="15">15 Min vorher</option><option value="30">30 Min</option><option value="60">1 Stunde</option><option value="1440">1 Tag</option><option value="10080">1 Woche</option>
            </select></div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={createEvent} loading={saving} disabled={!form.title||!form.start_date}>Speichern</Button>
          <button onClick={()=>setShowForm(false)} className="text-sm text-navy-400 cursor-pointer">Abbrechen</button>
        </div>
      </Card>
    )
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Kanzleikalender</h2>
        <div className="flex gap-2">
          <div className="flex bg-navy-50 rounded-xl p-0.5">{(['month','week','day'] as View[]).map(v=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer ${view===v?'bg-white shadow text-navy-800':'text-navy-400'}`}>{v==='month'?'Monat':v==='week'?'Woche':'Tag'}</button>
          ))}</div>
          <Button variant="primary" size="sm" onClick={()=>{setForm(f=>({...f,start_date:today}));setShowForm(!showForm)}}>{showForm?'Abbrechen':'+ Termin'}</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={()=>navigate(-1)} className="p-2 hover:bg-navy-50 rounded-xl cursor-pointer text-navy-400">←</button>
        <h3 className="text-lg font-semibold text-navy-800">{MONTHS[month]} {year}</h3>
        <button onClick={()=>navigate(1)} className="p-2 hover:bg-navy-50 rounded-xl cursor-pointer text-navy-400">→</button>
      </div>

      {showForm && !selectedDay && renderForm()}

      {view==='month' && (
        <div className="grid grid-cols-7 gap-px bg-navy-100 rounded-xl overflow-hidden">
          {WEEKDAYS.map(d=><div key={d} className="bg-navy-50 p-2 text-center text-xs font-semibold text-navy-500">{d}</div>)}
          {Array.from({length:startWeekday}).map((_,i)=><div key={`e${i}`} className="bg-white p-2 min-h-[80px]"/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = dateStr === today
            const holiday = holidays[dateStr]
            const dayEvents = getEventsForDate(dateStr)
            const dayDeadlines = getDeadlinesForDate(dateStr)
            const isWeekend = new Date(dateStr).getDay()===0 || new Date(dateStr).getDay()===6
            return (
              <div key={day} onClick={()=>setSelectedDay(dateStr)} className={`bg-white p-1.5 min-h-[80px] cursor-pointer hover:bg-gold-50 transition-colors ${isToday?'ring-2 ring-gold-400 ring-inset':''}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isToday?'bg-gold-400 text-white w-6 h-6 rounded-full flex items-center justify-center':isWeekend?'text-navy-300':'text-navy-600'}`}>{day}</span>
                  {holiday && <span className="text-[8px] text-red-500 truncate max-w-[60px]">{holiday}</span>}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayDeadlines.slice(0,2).map(dl=><div key={dl.id} className="text-[9px] bg-red-50 text-red-700 rounded px-1 truncate">⏰ {dl.title}</div>)}
                  {dayEvents.slice(0,2).map(ev=><div key={ev.id} className="text-[9px] rounded px-1 truncate text-white" style={{backgroundColor:ev.color}}>{ev.title}</div>)}
                  {(dayEvents.length+dayDeadlines.length)>2 && <div className="text-[8px] text-navy-400">+{dayEvents.length+dayDeadlines.length-2} mehr</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view==='week' && (()=>{
        const weekStart = new Date(currentDate)
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7))
        return (
          <div className="space-y-1">
            {Array.from({length:7}).map((_,i)=>{
              const d = new Date(weekStart); d.setDate(d.getDate()+i)
              const dateStr = d.toISOString().split('T')[0]
              const dayEvents = getEventsForDate(dateStr)
              const dayDeadlines = getDeadlinesForDate(dateStr)
              const isToday = dateStr===today
              return (
                <Card key={i} className={`p-3 cursor-pointer hover:border-gold-300 ${isToday?'border-gold-400 bg-gold-50/30':''}`} onClick={()=>setSelectedDay(dateStr)}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center"><p className="text-xs text-navy-400">{WEEKDAYS[i]}</p><p className={`text-lg font-bold ${isToday?'text-gold-600':'text-navy-800'}`}>{d.getDate()}</p></div>
                    <div className="flex-1 flex gap-2 flex-wrap">
                      {dayDeadlines.map(dl=><Badge key={dl.id} variant="error">⏰ {dl.title}</Badge>)}
                      {dayEvents.map(ev=><span key={ev.id} className="text-xs px-2 py-1 rounded text-white" style={{backgroundColor:ev.color}}>{ev.all_day?'':new Date(ev.start_time).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} {ev.title}</span>)}
                      {dayEvents.length===0 && dayDeadlines.length===0 && <span className="text-xs text-navy-300">—</span>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      })()}

      {view==='day' && (()=>{
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayEvents = getEventsForDate(dateStr)
        const dayDeadlines = getDeadlinesForDate(dateStr)
        return (
          <div className="space-y-2">
            <p className="text-sm text-navy-400">{currentDate.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</p>
            {holidays[dateStr] && <Card className="p-3 bg-red-50 border-red-200"><span className="text-sm text-red-700">🎉 {holidays[dateStr]}</span></Card>}
            {Array.from({length:12}).map((_,i)=>{
              const hour = i+8
              const hourStr = `${String(hour).padStart(2,'0')}:`
              const hourEvents = dayEvents.filter(e=>new Date(e.start_time).getHours()===hour)
              return (
                <div key={hour} className="flex gap-3 min-h-[48px]">
                  <span className="w-12 text-xs text-navy-400 pt-1 text-right">{hourStr}00</span>
                  <div className="flex-1 border-t border-navy-100 pt-1 space-y-1">
                    {hourEvents.map(ev=>(
                      <div key={ev.id} className="px-3 py-2 rounded-lg text-white text-sm" style={{backgroundColor:ev.color}}>
                        <span className="font-medium">{ev.title}</span>{ev.location && <span className="text-xs opacity-80 ml-2">📍 {ev.location}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {dayDeadlines.length>0 && <Card className="p-4"><h4 className="text-sm font-semibold text-navy-800 mb-2">Fristen & Wiedervorlagen</h4>{dayDeadlines.map(dl=>(<div key={dl.id} className="text-sm text-red-600">⏰ {dl.title}</div>))}</Card>}
          </div>
        )
      })()}
    </div>
  )
}
