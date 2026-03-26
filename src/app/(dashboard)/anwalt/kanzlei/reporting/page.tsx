'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'

interface Stats { totalRevenue:number; totalHours:number; totalCases:number; totalClients:number; revenueByMonth:{month:string;amount:number}[]; topClients:{name:string;amount:number}[]; casesByStatus:{status:string;count:number}[]; avgHourlyRate:number }

export default function ReportingPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async()=>{
      const { data:{user} } = await supabase.auth.getUser()
      if(!user) return
      const [r1,r2,r3,r4] = await Promise.all([
        supabase.from('time_entries').select('*').eq('user_id',user.id),
        supabase.from('cases').select('status').eq('user_id',user.id),
        supabase.from('kanzlei_clients').select('id,first_name,last_name').eq('user_id',user.id),
        supabase.from('kanzlei_invoices').select('total_amount,client_id,created_at,status').eq('user_id',user.id),
      ])
      const entries = (r1.data||[]) as Array<{duration_minutes:number;hourly_rate:number|null;date:string;billable:boolean}>
      const cases = (r2.data||[]) as Array<{status:string}>
      const clients = (r3.data||[]) as Array<{id:string;first_name:string;last_name:string}>
      const invoices = (r4.data||[]) as Array<{total_amount:number;client_id:string;created_at:string;status:string}>

      const totalHours = entries.reduce((s,e)=>s+e.duration_minutes,0)/60
      const totalRevenue = entries.filter(e=>e.billable).reduce((s,e)=>s+(e.duration_minutes/60)*(e.hourly_rate||250),0)
      const rates = entries.filter(e=>e.hourly_rate).map(e=>e.hourly_rate as number)
      const avgHourlyRate = rates.length ? rates.reduce((a,b)=>a+b,0)/rates.length : 250

      // Revenue by month
      const monthMap = new Map<string,number>()
      for(const e of entries.filter(e=>e.billable)) {
        const m = e.date.substring(0,7)
        monthMap.set(m, (monthMap.get(m)||0) + (e.duration_minutes/60)*(e.hourly_rate||250))
      }
      const revenueByMonth = Array.from(monthMap.entries()).map(([month,amount])=>({month,amount})).sort((a,b)=>a.month.localeCompare(b.month)).slice(-12)

      // Cases by status
      const statusMap = new Map<string,number>()
      for(const c of cases) statusMap.set(c.status, (statusMap.get(c.status)||0)+1)
      const casesByStatus = Array.from(statusMap.entries()).map(([status,count])=>({status,count}))

      // Top clients by invoice amount
      const clientMap = new Map<string,number>()
      for(const inv of invoices.filter(i=>i.status==='paid')) clientMap.set(inv.client_id, (clientMap.get(inv.client_id)||0)+(inv.total_amount||0))
      const topClients = Array.from(clientMap.entries()).map(([cid,amount])=>{
        const cl = clients.find(c=>c.id===cid)
        return { name: cl?`${cl.first_name} ${cl.last_name}`:'Unbekannt', amount }
      }).sort((a,b)=>b.amount-a.amount).slice(0,5)

      setStats({ totalRevenue, totalHours, totalCases:cases.length, totalClients:clients.length, revenueByMonth, topClients, casesByStatus, avgHourlyRate })
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin"/></div>
  if(!stats) return null
  const maxRev = Math.max(...stats.revenueByMonth.map(r=>r.amount), 1)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-800">Kanzlei-Reporting</h2>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5"><p className="text-xs text-navy-400">Gesamtumsatz</p><p className="text-2xl font-bold text-gold-600">{stats.totalRevenue.toFixed(0)} €</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-400">Stunden erfasst</p><p className="text-2xl font-bold text-navy-900">{stats.totalHours.toFixed(1)} h</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-400">Ø Stundensatz</p><p className="text-2xl font-bold text-navy-900">{stats.avgHourlyRate.toFixed(0)} €</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-400">Akten / Mandanten</p><p className="text-2xl font-bold text-navy-900">{stats.totalCases} / {stats.totalClients}</p></Card>
      </div>

      {/* Export */}
      <div className="flex gap-2 justify-end">
        <button onClick={()=>{
          if(!stats) return
          const csv = `Kennzahl;Wert\nGesamtumsatz;${stats.totalRevenue.toFixed(2)}\nStunden;${stats.totalHours.toFixed(1)}\nØ Stundensatz;${stats.avgHourlyRate.toFixed(0)}\nAkten;${stats.totalCases}\nMandanten;${stats.totalClients}\n\nMonat;Umsatz\n${stats.revenueByMonth.map(r=>`${r.month};${r.amount.toFixed(2)}`).join('\n')}\n\nAkten-Status;Anzahl\n${stats.casesByStatus.map(c=>`${c.status};${c.count}`).join('\n')}`
          const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Kanzlei-Report.csv'; a.click()
        }} className="text-xs text-gold-600 cursor-pointer hover:text-gold-800">📥 CSV Export</button>
        <button onClick={()=>{
          if(!stats) return
          const text = `KANZLEI-REPORT\n${'='.repeat(40)}\n\nGesamtumsatz: ${stats.totalRevenue.toFixed(2)} €\nStunden erfasst: ${stats.totalHours.toFixed(1)} h\nØ Stundensatz: ${stats.avgHourlyRate.toFixed(0)} €\nAkten: ${stats.totalCases}\nMandanten: ${stats.totalClients}\n\nUmsatz pro Monat:\n${stats.revenueByMonth.map(r=>`  ${r.month}: ${r.amount.toFixed(2)} €`).join('\n')}\n\nAkten nach Status:\n${stats.casesByStatus.map(c=>`  ${c.status}: ${c.count}`).join('\n')}\n\nTop-Mandanten:\n${stats.topClients.map((c,i)=>`  ${i+1}. ${c.name}: ${c.amount.toFixed(2)} €`).join('\n')}`
          const blob=new Blob([text],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Kanzlei-Report.txt'; a.click()
        }} className="text-xs text-navy-500 cursor-pointer hover:text-navy-700">📄 Text Export</button>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-navy-800 mb-4">Umsatz pro Monat</h3>
        {stats.revenueByMonth.length===0 ? <p className="text-sm text-navy-400">Keine Daten.</p> : (
          <div className="flex items-end gap-2 h-48">
            {stats.revenueByMonth.map(r=>(
              <div key={r.month} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full bg-gold-400 rounded-t-lg transition-all" style={{height:`${(r.amount/maxRev)*100}%`,minHeight:'4px'}}/>
                <p className="text-[10px] text-navy-400 mt-1 truncate w-full text-center">{r.month.substring(5)}</p>
                <p className="text-[10px] font-bold text-navy-600">{(r.amount/1000).toFixed(1)}k</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cases by Status */}
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Akten nach Status</h3>
          {stats.casesByStatus.length===0?<p className="text-sm text-navy-400">Keine Akten.</p>:(
            <div className="space-y-2">{stats.casesByStatus.map(c=>(
              <div key={c.status} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <span className="text-sm text-navy-700 capitalize">{c.status.replace('_',' ')}</span>
                <span className="font-bold text-navy-800">{c.count}</span>
              </div>
            ))}</div>
          )}
        </Card>

        {/* Top Clients */}
        <Card className="p-6">
          <h3 className="font-semibold text-navy-800 mb-4">Top-Mandanten (bezahlt)</h3>
          {stats.topClients.length===0?<p className="text-sm text-navy-400">Keine Daten.</p>:(
            <div className="space-y-2">{stats.topClients.map((c,i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <span className="text-sm text-navy-700">{i+1}. {c.name}</span>
                <span className="font-bold text-gold-600">{c.amount.toFixed(0)} €</span>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
    </div>
  )
}
