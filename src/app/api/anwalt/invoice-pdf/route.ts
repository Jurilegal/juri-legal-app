import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('id')
  if (!invoiceId) return NextResponse.json({ error: 'Invoice ID fehlt' }, { status: 400 })

  // Get invoice + settings
  const [invRes, settingsRes] = await Promise.all([
    supabase.from('kanzlei_invoices').select('*').eq('id', invoiceId).eq('user_id', user.id).single(),
    supabase.from('kanzlei_settings').select('*').eq('user_id', user.id).single(),
  ])
  if (!invRes.data) return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })

  const inv = invRes.data as Record<string, unknown>
  const s = (settingsRes.data || {}) as Record<string, string>

  // Get client
  let clientName = 'Mandant'
  let clientAddress = ''
  if (inv.client_id) {
    const { data: client } = await supabase.from('kanzlei_clients').select('first_name,last_name,email,address').eq('id', inv.client_id).single()
    if (client) {
      clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim()
      clientAddress = (client as Record<string,string>).address || ''
    }
  }

  // Get time entries for this invoice
  const items = (inv.items as Array<{description:string;hours:number;rate:number;amount:number}>) || []

  const netAmount = (inv.total_amount as number) / 1.19
  const tax = (inv.total_amount as number) - netAmount

  // Generate HTML for PDF
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #1B2A4A; font-size: 11px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .logo { font-size: 20px; font-weight: bold; color: #1B2A4A; }
  .logo span { color: #D4A843; }
  .kanzlei-info { text-align: right; font-size: 9px; color: #666; }
  .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .address-block { }
  .address-label { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .invoice-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
  .meta-row { display: flex; gap: 40px; margin-bottom: 20px; font-size: 10px; }
  .meta-item { }
  .meta-label { color: #999; }
  .header-text { margin-bottom: 20px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 9px; color: #666; border-bottom: 2px solid #ddd; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  .text-right { text-align: right; }
  .total-row { font-weight: bold; font-size: 13px; }
  .total-section { margin-top: 10px; width: 250px; margin-left: auto; }
  .total-line { display: flex; justify-content: space-between; padding: 4px 0; }
  .total-line.final { border-top: 2px solid #1B2A4A; font-weight: bold; font-size: 14px; padding-top: 8px; margin-top: 4px; }
  .footer-text { margin-top: 30px; font-size: 10px; color: #666; }
  .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 8px; color: #999; display: flex; justify-content: space-between; }
</style></head><body>
  <div class="header">
    <div class="logo">${s.logo_url ? `<img src="${s.logo_url}" height="40" alt="Logo"/>` : `<span>Juri</span>Legal`}</div>
    <div class="kanzlei-info">
      ${s.kanzlei_name ? `<strong>${s.kanzlei_name}</strong><br>` : ''}
      ${s.address_line1 || ''}${s.address_line2 ? '<br>' + s.address_line2 : ''}<br>
      ${s.zip || ''} ${s.city || ''}<br>
      ${s.phone ? 'Tel: ' + s.phone + '<br>' : ''}
      ${s.email || ''}
    </div>
  </div>
  <div class="addresses">
    <div class="address-block">
      <div class="address-label">Rechnungsempfänger</div>
      <strong>${clientName}</strong><br>${clientAddress}
    </div>
  </div>
  <div class="invoice-title">Rechnung ${inv.invoice_number || ''}</div>
  <div class="meta-row">
    <div class="meta-item"><span class="meta-label">Datum: </span>${new Date(inv.created_at as string).toLocaleDateString('de-DE')}</div>
    <div class="meta-item"><span class="meta-label">Rechnungsnr.: </span>${inv.invoice_number || ''}</div>
  </div>
  ${s.header_text ? `<div class="header-text">${s.header_text}</div>` : '<div class="header-text">für meine Tätigkeit in der oben genannten Angelegenheit erlaube ich mir wie folgt abzurechnen:</div>'}
  <table>
    <thead><tr><th>Pos.</th><th>Beschreibung</th><th class="text-right">Stunden</th><th class="text-right">Satz</th><th class="text-right">Betrag</th></tr></thead>
    <tbody>
      ${items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.description}</td><td class="text-right">${item.hours?.toFixed(2) || '-'}</td><td class="text-right">${item.rate?.toFixed(2) || '-'} €</td><td class="text-right">${item.amount?.toFixed(2) || '0.00'} €</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="total-section">
    <div class="total-line"><span>Nettobetrag:</span><span>${netAmount.toFixed(2)} €</span></div>
    <div class="total-line"><span>USt. 19%:</span><span>${tax.toFixed(2)} €</span></div>
    <div class="total-line final"><span>Gesamtbetrag:</span><span>${(inv.total_amount as number).toFixed(2)} €</span></div>
  </div>
  ${s.footer_text ? `<div class="footer-text">${s.footer_text}</div>` : '<div class="footer-text">Zahlbar innerhalb von 14 Tagen ohne Abzug auf das unten genannte Konto.</div>'}
  <div class="footer">
    <div>${s.kanzlei_name || 'Kanzlei'} · ${s.address_line1 || ''} · ${s.zip || ''} ${s.city || ''}</div>
    <div>${s.bank_name ? s.bank_name + ' · ' : ''}${s.iban ? 'IBAN: ' + s.iban : ''}</div>
    <div>${s.tax_id ? 'St.-Nr.: ' + s.tax_id : ''}</div>
  </div>
</body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
