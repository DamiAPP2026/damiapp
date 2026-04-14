import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Plus, Save, PenSquare, Trash2, ShowerHead, Sparkles, Waves, Activity, CircleDot, X, ChevronRight, TimerReset, Filter, ListChecks, Baby, Toilet, ArrowDownWideNarrow } from 'lucide-react'
import ToiletCharts from './ToiletCharts'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const cardSh = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

const MODALITA = ['CAA guidata', 'CAA autonoma', 'Manuale', 'Assistita']
const BISOGNI = ['Pipì', 'Cacca', 'Entrambi', 'Nessuno']

const DEMO = [
  { id: 1, data: '14042026', ora: '0830', bisogno: 'Pipì', modalita: 'CAA guidata', incidentePippi: false, oraPippi: '', incidenteCacca: false, oraCacca: '', note: 'Mattina tranquilla', timestamp: Date.now() - 86400000 * 2 },
  { id: 2, data: '14042026', ora: '1230', bisogno: 'Entrambi', modalita: 'CAA autonoma', incidentePippi: true, oraPippi: '1237', incidenteCacca: false, oraCacca: '', note: 'Piccolo incidente pipì', timestamp: Date.now() - 86400000 },
  { id: 3, data: '13042026', ora: '1815', bisogno: 'Cacca', modalita: 'Manuale', incidentePippi: false, oraPippi: '', incidenteCacca: true, oraCacca: '1820', note: 'Serale', timestamp: Date.now() - 3600000 * 8 },
]

function oggiStr(d = new Date()) {
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`
}

function toISOdata(data) {
  if (!data) return ''
  if (data.includes('-')) return data
  const dd = data.slice(0, 2)
  const mm = data.slice(2, 4)
  const yyyy = data.slice(4)
  return `${yyyy}-${mm}-${dd}`
}

function toITAdata(data) {
  if (!data) return ''
  if (!data.includes('-')) return data
  const [yyyy, mm, dd] = data.split('-')
  return `${dd}${mm}${yyyy}`
}

function fmtDateLabel(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return ddmmyyyy || ''
  return `${ddmmyyyy.slice(0, 2)}/${ddmmyyyy.slice(2, 4)}/${ddmmyyyy.slice(4)}`
}

function todayTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
}

function parseMin(t) {
  if (!t || t.length < 4) return 0
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(2, 4))
}

function weekLabel(offset) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return oggiStr(d)
}

export default function ToiletPage({ onBack, isDemo, onNavigate }) {
  const [tab, setTab] = useState('sessioni')
  const [items, setItems] = useState(DEMO)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [month, setMonth] = useState(new Date())
  const [filterNeed, setFilterNeed] = useState('tutti')
  const [filterMode, setFilterMode] = useState('tutti')
  const [form, setForm] = useState({ data: oggiStr(), ora: todayTime(), bisogno: 'Nessuno', modalita: 'CAA guidata', incidentePippi: false, oraPippi: '', incidenteCacca: false, oraCacca: '', note: '' })
  const chartRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    setForm({
      data: editing.data || oggiStr(),
      ora: editing.ora || todayTime(),
      bisogno: editing.bisogno || 'Nessuno',
      modalita: editing.modalita || 'CAA guidata',
      incidentePippi: !!editing.incidentePippi,
      oraPippi: editing.oraPippi || '',
      incidenteCacca: !!editing.incidenteCacca,
      oraCacca: editing.oraCacca || '',
      note: editing.note || '',
    })
    setShowForm(true)
  }, [editing])

  const filtered = useMemo(() => {
    return items.filter((x) => {
      const okNeed = filterNeed === 'tutti' || x.bisogno === filterNeed
      const okMode = filterMode === 'tutti' || x.modalita === filterMode
      return okNeed && okMode
    }).sort((a, b) => (b.data + b.ora).localeCompare(a.data + a.ora))
  }, [items, filterNeed, filterMode])

  const stats = useMemo(() => {
    const total = items.length
    const pipi = items.filter((x) => x.bisogno === 'Pipì' || x.bisogno === 'Entrambi').length
    const cacca = items.filter((x) => x.bisogno === 'Cacca' || x.bisogno === 'Entrambi').length
    const inc = items.filter((x) => x.incidentePippi || x.incidenteCacca).length
    return { total, pipi, cacca, inc }
  }, [items])

  const monthLabel = month.toLocaleString('it-IT', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDow = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const grid = Array.from({ length: firstDow === 0 ? 6 : firstDow - 1 }).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const byDay = items.reduce((acc, x) => {
    if (x.data.slice(2, 4) === String(month.getMonth() + 1).padStart(2, '0') && x.data.slice(4) === String(month.getFullYear())) {
      const d = Number(x.data.slice(0, 2))
      acc[d] = (acc[d] || 0) + 1
    }
    return acc
  }, {})

  const saveItem = () => {
    const data = { ...form, id: editing?.id || Date.now(), timestamp: Date.now() }
    setItems((prev) => editing ? prev.map((x) => (x.id === editing.id ? { ...data } : x)) : [data, ...prev])
    setEditing(null)
    setShowForm(false)
    setForm({ data: oggiStr(), ora: todayTime(), bisogno: 'Nessuno', modalita: 'CAA guidata', incidentePippi: false, oraPippi: '', incidenteCacca: false, oraCacca: '', note: '' })
  }

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f7',fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",paddingBottom:110}}>
      <div style={{background:'linear-gradient(135deg,#7B5EA7,#4A6CF7)',padding:'14px 16px 18px',boxShadow:sh}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <button onClick={onBack} style={{width:38,height:38,borderRadius:999,border:'none',background:'rgba(255,255,255,0.16)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
            <ArrowLeft size={20} />
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:f(20),fontWeight:900,color:'#fff'}}>Toilet Training</div>
            <div style={{fontSize:f(11),color:'rgba(255,255,255,0.7)'}}>{isDemo ? 'Modalità demo' : 'Sessioni, incidenti e grafici'}</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{width:38,height:38,borderRadius:999,border:'none',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#7B5EA7'}}>
            <Plus size={20} />
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            { label: 'Sessioni', value: stats.total },
            { label: 'Pipì', value: stats.pipi },
            { label: 'Cacca', value: stats.cacca },
            { label: 'Incidenti', value: stats.inc },
          ].map((s) => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:14,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:f(18),fontWeight:900,color:'#fff'}}>{s.value}</div>
              <div style={{fontSize:f(10),color:'rgba(255,255,255,0.7)'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:12}}>
        <div style={{display:'flex',gap:8,background:'#fff',borderRadius:16,padding:6,boxShadow:cardSh,marginBottom:12}}>
          {[
            ['sessioni', 'Lista'],
            ['calendario', 'Calendario'],
            ['stat', 'Statistiche'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{flex:1,border:'none',borderRadius:12,padding:'10px 8px',background:tab===k?'#EEF3FD':'transparent',color:tab===k?'#193f9e':'#394058',fontWeight:800,fontSize:f(12)}}>{label}</button>
          ))}
        </div>

        {tab === 'sessioni' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontSize:f(12),fontWeight:700,color:'#7c8088'}}>Tocca una sessione per modificarla</div>
              <button onClick={() => setShowFilters((v) => !v)} style={{display:'flex',alignItems:'center',gap:6,border:'none',background:'#fff',borderRadius:999,padding:'9px 12px',boxShadow:cardSh,color:'#193f9e',fontWeight:800,fontSize:f(12)}}><Filter size={14} /> Filtri</button>
            </div>
            {showFilters && (
              <div style={{background:'#fff',borderRadius:18,padding:12,boxShadow:cardSh,marginBottom:12}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <select value={filterNeed} onChange={(e) => setFilterNeed(e.target.value)} style={{border:'1px solid rgba(2,21,63,0.12)',borderRadius:12,padding:12,background:'#f8fafc'}}>
                    <option value="tutti">Tutti i bisogni</option>
                    {BISOGNI.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} style={{border:'1px solid rgba(2,21,63,0.12)',borderRadius:12,padding:12,background:'#f8fafc'}}>
                    <option value="tutti">Tutte le modalità</option>
                    {MODALITA.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}

            {filtered.map((x) => (
              <div key={x.id} style={{background:'#fff',borderRadius:18,padding:14,boxShadow:cardSh,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                      <div style={{fontSize:f(14),fontWeight:900,color:'#02153f'}}>{fmtDateLabel(x.data)} • {x.ora.slice(0,2)}:{x.ora.slice(2,4)}</div>
                      <span style={{fontSize:f(10),padding:'3px 8px',borderRadius:999,background:'#EEF3FD',color:'#193f9e',fontWeight:800}}>{x.bisogno}</span>
                      <span style={{fontSize:f(10),padding:'3px 8px',borderRadius:999,background:'#f3f4f7',color:'#394058',fontWeight:800}}>{x.modalita}</span>
                    </div>
                    <div style={{fontSize:f(11),color:'#7c8088',lineHeight:1.5}}>
                      {x.note || 'Nessuna nota'}
                    </div>
                    <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                      {x.incidentePippi && <span style={{fontSize:f(10),padding:'4px 8px',borderRadius:999,background:'#FEF0F4',color:'#F7295A',fontWeight:800}}>Incidente pipì {x.oraPippi ? `• ${x.oraPippi.slice(0,2)}:${x.oraPippi.slice(2,4)}` : ''}</span>}
                      {x.incidenteCacca && <span style={{fontSize:f(10),padding:'4px 8px',borderRadius:999,background:'#FFF5EE',color:'#FF8C42',fontWeight:800}}>Incidente cacca {x.oraCacca ? `• ${x.oraCacca.slice(0,2)}:${x.oraCacca.slice(2,4)}` : ''}</span>}
                    </div>
                  </div>
                  <button onClick={() => setEditing(x)} style={{width:38,height:38,borderRadius:12,border:'none',background:'#EEF3FD',color:'#193f9e',display:'flex',alignItems:'center',justifyContent:'center'}}><PenSquare size={18} /></button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'calendario' && (
          <div style={{background:'#fff',borderRadius:18,padding:14,boxShadow:cardSh}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <div style={{fontSize:f(16),fontWeight:900,color:'#02153f'}}>{monthLabel}</div>
                <div style={{fontSize:f(11),color:'#7c8088'}}>Giorni con sessioni evidenziati</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={{border:'none',background:'#f3f4f7',borderRadius:12,padding:'10px 12px'}}><ChevronRight size={16} style={{transform:'rotate(180deg)'}} /></button>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={{border:'none',background:'#f3f4f7',borderRadius:12,padding:'10px 12px'}}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,fontSize:f(10),color:'#7c8088',fontWeight:800,marginBottom:8,textAlign:'center'}}>
              {['L','M','M','G','V','S','D'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
              {grid.map((d, i) => (
                <div key={i} style={{aspectRatio:'1/1',borderRadius:14,background:d ? (byDay[d] ? '#EEF3FD' : '#f8fafc') : 'transparent',border:d ? '1px solid rgba(2,21,63,0.08)' : 'none',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',color:d ? '#02153f' : 'transparent',fontWeight:800}}>
                  {d || ''}
                  {d && byDay[d] ? <span style={{position:'absolute',bottom:8,right:8,width:8,height:8,borderRadius:999,background:'#7B5EA7'}} /> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'stat' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[
                { l: 'Ultime 7 giornate', v: items.filter((x) => parseInt(x.data, 10) >= parseInt(weekLabel(7), 10)).length, c: '#7B5EA7' },
                { l: 'Incidenti', v: stats.inc, c: '#F7295A' },
                { l: 'CAA autonoma', v: items.filter((x) => x.modalita === 'CAA autonoma').length, c: '#00BFA6' },
                { l: 'CAA guidata', v: items.filter((x) => x.modalita === 'CAA guidata').length, c: '#193f9e' },
              ].map((s) => (
                <div key={s.l} style={{background:'#fff',borderRadius:18,padding:14,boxShadow:cardSh}}>
                  <div style={{fontSize:f(11),color:'#7c8088',marginBottom:8}}>{s.l}</div>
                  <div style={{fontSize:f(20),fontWeight:900,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:18,padding:14,boxShadow:cardSh,marginBottom:12}}>
              <ToiletCharts dati={items} compact titolo={false} />
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div onClick={() => { setShowForm(false); setEditing(null) }} style={{position:'fixed',inset:0,background:'rgba(2,21,63,0.45)',display:'flex',alignItems:'flex-end',zIndex:40}}>
          <div onClick={(e) => e.stopPropagation()} style={{width:'100%',maxWidth:480,margin:'0 auto',background:'#fff',borderTopLeftRadius:22,borderTopRightRadius:22,padding:14,boxShadow:sh,maxHeight:'88vh',overflowY:'auto'}}>
            <div style={{width:42,height:5,borderRadius:999,background:'#d9dfeb',margin:'0 auto 14px'}} />
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:f(16),fontWeight:900,color:'#02153f'}}>{editing ? 'Modifica sessione' : 'Nuova sessione'}</div>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={{border:'none',background:'#f3f4f7',width:36,height:36,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}><X size={18} /></button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <label style={{display:'grid',gap:6,fontSize:f(11),fontWeight:800,color:'#394058'}}>Data
                <input value={form.data} onChange={(e) => setField('data', e.target.value)} placeholder="ddmmyyyy" style={{padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}} />
              </label>
              <label style={{display:'grid',gap:6,fontSize:f(11),fontWeight:800,color:'#394058'}}>Ora
                <input value={form.ora} onChange={(e) => setField('ora', e.target.value)} placeholder="hhmm" style={{padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}} />
              </label>
            </div>

            <div style={{marginTop:10,display:'grid',gap:10}}>
              <div style={{fontSize:f(11),fontWeight:800,color:'#394058'}}>Bisogno</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {BISOGNI.map((b) => (
                  <button key={b} onClick={() => setField('bisogno', b)} style={{border:'1px solid rgba(2,21,63,0.12)',background:form.bisogno===b?'#EEF3FD':'#fff',color:form.bisogno===b?'#193f9e':'#02153f',borderRadius:12,padding:'11px 10px',fontWeight:800}}>{b}</button>
                ))}
              </div>
            </div>

            <div style={{marginTop:10,display:'grid',gap:10}}>
              <div style={{fontSize:f(11),fontWeight:800,color:'#394058'}}>Modalità</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {MODALITA.map((m) => (
                  <button key={m} onClick={() => setField('modalita', m)} style={{border:'1px solid rgba(2,21,63,0.12)',background:form.modalita===m?'#EEF3FD':'#fff',color:form.modalita===m?'#193f9e':'#02153f',borderRadius:12,padding:'11px 10px',fontWeight:800}}>{m}</button>
                ))}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <label style={{display:'flex',alignItems:'center',gap:8,padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}}>
                <input type="checkbox" checked={form.incidentePippi} onChange={(e) => setField('incidentePippi', e.target.checked)} /> Incidente pipì
              </label>
              <label style={{display:'flex',alignItems:'center',gap:8,padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}}>
                <input type="checkbox" checked={form.incidenteCacca} onChange={(e) => setField('incidenteCacca', e.target.checked)} /> Incidente cacca
              </label>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <label style={{display:'grid',gap:6,fontSize:f(11),fontWeight:800,color:'#394058'}}>Ora pipì
                <input value={form.oraPippi} onChange={(e) => setField('oraPippi', e.target.value)} placeholder="hhmm" style={{padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}} />
              </label>
              <label style={{display:'grid',gap:6,fontSize:f(11),fontWeight:800,color:'#394058'}}>Ora cacca
                <input value={form.oraCacca} onChange={(e) => setField('oraCacca', e.target.value)} placeholder="hhmm" style={{padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)'}} />
              </label>
            </div>

            <label style={{display:'grid',gap:6,fontSize:f(11),fontWeight:800,color:'#394058',marginTop:10}}>Note
              <textarea value={form.note} onChange={(e) => setField('note', e.target.value)} rows={3} style={{padding:12,borderRadius:12,border:'1px solid rgba(2,21,63,0.12)',resize:'vertical'}} />
            </label>

            <button onClick={saveItem} style={{marginTop:14,width:'100%',border:'none',borderRadius:14,padding:'13px 14px',background:'linear-gradient(135deg,#7B5EA7,#4A6CF7)',color:'#fff',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <Save size={18} /> {editing ? 'Aggiorna sessione' : 'Salva sessione'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
