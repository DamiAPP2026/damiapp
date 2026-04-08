import { useEffect, useRef } from 'react'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

// Grafico barre orizzontali — fasce orarie
function GraficoFasceOrarie({ dati, compact = false }) {
  const fasceOrarie = [
    { label: 'Notte (00-06)', key: 'notte', color: '#7B5EA7' },
    { label: 'Mattina (06-12)', key: 'mattina', color: '#2e84e9' },
    { label: 'Pomeriggio (12-18)', key: 'pomeriggio', color: '#FF8C42' },
    { label: 'Sera (18-24)', key: 'sera', color: '#F7295A' },
  ]

  const counts = { notte: 0, mattina: 0, pomeriggio: 0, sera: 0 }
  dati.forEach(s => {
    const ora = parseInt((s.ora || '00:00').split(':')[0])
    if (ora >= 0 && ora < 6) counts.notte++
    else if (ora >= 6 && ora < 12) counts.mattina++
    else if (ora >= 12 && ora < 18) counts.pomeriggio++
    else counts.sera++
  })
  const max = Math.max(...Object.values(counts), 1)

  return (
    <div>
      {fasceOrarie.map(({ label, key, color }) => (
        <div key={key} style={{ marginBottom: compact ? '6px' : '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: f(compact ? 9 : 11), color: '#394058', fontWeight: '600' }}>{label}</span>
            <span style={{ fontSize: f(compact ? 9 : 11), color, fontWeight: '800' }}>{counts[key]}</span>
          </div>
          <div style={{ height: compact ? '5px' : '7px', borderRadius: '4px', background: '#f3f4f7', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${(counts[key] / max) * 100}%`,
              background: color, transition: 'width 0.4s'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Grafico canvas — andamento 7 giorni
function GraficoAndamento7gg({ dati }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const W = canvasRef.current.width
    const H = canvasRef.current.height
    ctx.clearRect(0, 0, W, H)

    // Ultimi 7 giorni
    const giorni = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dataStr = d.toLocaleDateString('it-IT')
      const bagno = dati.filter(s => s.data === dataStr && s.bisogno && s.bisogno !== 'nessuno').length
      const incidenti = dati.filter(s => s.data === dataStr && (s.incidentePippi || s.incidenteCacca)).length
      const label = ['L', 'M', 'M', 'G', 'V', 'S', 'D'][d.getDay() === 0 ? 6 : d.getDay() - 1]
      giorni.push({ label, bagno, incidenti })
    }

    const maxVal = Math.max(...giorni.map(g => g.bagno + g.incidenti), 1)
    const barW = (W - 40) / giorni.length - 4
    const chartH = H - 28

    giorni.forEach((g, i) => {
      const x = 20 + i * ((W - 40) / giorni.length)

      // Barra bagno
      if (g.bagno > 0) {
        const barH = (g.bagno / maxVal) * chartH * 0.85
        const y = chartH - barH
        ctx.fillStyle = '#7B5EA7'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH + 2, [4, 4, 0, 0]); ctx.fill()
      }

      // Barra incidenti sopra
      if (g.incidenti > 0) {
        const barHB = (g.bagno / maxVal) * chartH * 0.85
        const barHI = (g.incidenti / maxVal) * chartH * 0.5
        const y = chartH - barHB - barHI
        ctx.fillStyle = '#F7295A'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barHI, [4, 4, 0, 0]); ctx.fill()
      }

      if (g.bagno === 0 && g.incidenti === 0) {
        ctx.fillStyle = '#f0f1f4'
        ctx.beginPath(); ctx.roundRect(x, chartH - 3, barW, 3, [2, 2, 0, 0]); ctx.fill()
      }

      // Label
      ctx.fillStyle = '#bec1cc'
      ctx.font = `10px -apple-system`
      ctx.textAlign = 'center'
      ctx.fillText(g.label, x + barW / 2, H - 8)
    })
  }, [dati])

  return <canvas ref={canvasRef} width={420} height={110} style={{ width: '100%', height: 'auto' }} />
}

// COMPONENTE PRINCIPALE — usato ovunque
export default function ToiletCharts({ dati, compact = false, titolo = true }) {
  const oggi = new Date().toLocaleDateString('it-IT')
  const ieri = new Date(Date.now() - 86400000).toLocaleDateString('it-IT')

  const bagnoOggi = dati.filter(s => s.data === oggi && s.bisogno && s.bisogno !== 'nessuno').length
  const incidentiOggi = dati.filter(s => s.data === oggi && (s.incidentePippi || s.incidenteCacca)).length
  const bagnoIeri = dati.filter(s => s.data === ieri && s.bisogno && s.bisogno !== 'nessuno').length
  const incidentiIeri = dati.filter(s => s.data === ieri && (s.incidentePippi || s.incidenteCacca)).length

  const bagno7gg = dati.filter(s => {
    const d = s.timestamp || Date.now()
    return Date.now() - d < 7 * 86400000 && s.bisogno && s.bisogno !== 'nessuno'
  }).length

  const pipi = dati.filter(s => s.bisogno === 'pippi' || s.bisogno === 'entrambi').length
  const cacca = dati.filter(s => s.bisogno === 'cacca' || s.bisogno === 'entrambi').length
  const incidentiTot = dati.filter(s => s.incidentePippi || s.incidenteCacca).length
  const autonomia = dati.filter(s => s.modalita === 'caa-auto').length

  if (dati.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#bec1cc' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚽</div>
      <div style={{ fontSize: f(13) }}>Nessuna sessione registrata</div>
    </div>
  )

  return (
    <div>
      {titolo && (
        <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f', marginBottom: '12px' }}>
          📊 Andamento Toilet Training
        </div>
      )}

      {/* STATS RAPIDE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: 'Bagno oggi', val: bagnoOggi, color: '#7B5EA7', bg: '#F5F3FF' },
          { label: 'Incidenti oggi', val: incidentiOggi, color: incidentiOggi > 0 ? '#F7295A' : '#00BFA6', bg: incidentiOggi > 0 ? '#FEF0F4' : '#E8FBF8' },
          { label: 'Bagno ieri', val: bagnoIeri, color: '#7B5EA7', bg: '#F5F3FF' },
          { label: 'Inc. ieri', val: incidentiIeri, color: incidentiIeri > 0 ? '#F7295A' : '#00BFA6', bg: incidentiIeri > 0 ? '#FEF0F4' : '#E8FBF8' },
        ].map(({ label, val, color, bg }, i) => (
          <div key={i} style={{ background: bg, borderRadius: '12px', padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: f(18), fontWeight: '900', color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: f(8), color: '#7c8088', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ANDAMENTO 7 GIORNI */}
      {!compact && (
        <div style={{ background: '#f3f4f7', borderRadius: '14px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: f(12), fontWeight: '800', color: '#02153f' }}>Andamento 7 giorni</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: f(9), fontWeight: '700', color: '#7B5EA7' }}>■ Bagno</span>
              <span style={{ fontSize: f(9), fontWeight: '700', color: '#F7295A' }}>■ Incidente</span>
            </div>
          </div>
          <GraficoAndamento7gg dati={dati} />
        </div>
      )}

      {/* DISTRIBUZIONE ORARIA */}
      <div style={{ background: '#f3f4f7', borderRadius: '14px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: f(12), fontWeight: '800', color: '#02153f', marginBottom: '8px' }}>
          🕐 Distribuzione oraria
        </div>
        <GraficoFasceOrarie dati={dati.filter(s => s.bisogno && s.bisogno !== 'nessuno')} compact={compact} />
      </div>

      {/* STATISTICHE TIPOLOGIE */}
      {!compact && (
        <div style={{ background: '#f3f4f7', borderRadius: '14px', padding: '12px' }}>
          <div style={{ fontSize: f(12), fontWeight: '800', color: '#02153f', marginBottom: '10px' }}>
            📋 Riepilogo totale
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Sessioni bagno 7gg', val: bagno7gg, color: '#7B5EA7' },
              { label: 'Incidenti totali', val: incidentiTot, color: '#F7295A' },
              { label: 'Pipì in bagno', val: pipi, color: '#2e84e9' },
              { label: 'Cacca in bagno', val: cacca, color: '#FF8C42' },
              { label: 'CAA autonoma', val: autonomia, color: '#00BFA6' },
              { label: 'Sessioni totali', val: dati.length, color: '#394058' },
            ].map(({ label, val, color }, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 4 ? '1px solid #e8eaf0' : 'none' }}>
                <span style={{ fontSize: f(11), color: '#394058' }}>{label}</span>
                <span style={{ fontSize: f(14), fontWeight: '900', color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}