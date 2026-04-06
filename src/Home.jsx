import { useState, useEffect, useRef } from 'react'
import {
  ChevronRight, Pencil, Play, Square, RotateCcw,
  Home, BookOpen, Pill, Droplets, BarChart2, Settings,
  AlertTriangle, Clock, Bell, Phone
} from 'lucide-react'

const DEMO_DATA = {
  ultimaCrisi: '12g', ultimaCrisiSub: 'al 25/03',
  prossimaTerapia: '18:00', prossimaTerapiaSub: 'Keppra 500mg',
  scadenze: '3', scadenzeSub: 'entro 15g',
  terapie: [
    {n:'Keppra 500mg', c:'#F7295A', o:'08:00'},
    {n:'Depakine 250ml', c:'#00BFA6', o:'13:00'},
    {n:'Keppra 500mg', c:'#7B5EA7', o:'20:00'},
  ],
  scadenzeMed: [
    {n:'Keppra', g:'6g', c:'#F7295A'},
    {n:'Depakine', g:'14g', c:'#FFD93D'},
    {n:'Rivotril', g:'22g', c:'#7B5EA7'},
  ],
  barsSettimana: [60,30,80,20,100,50,70],
  barsStats: [40,65,85,50,100,70,90],
}

const REAL_DATA = {
  ultimaCrisi: '26g', ultimaCrisiSub: 'al 20/03',
  prossimaTerapia: '20:00', prossimaTerapiaSub: 'Keppra',
  scadenze: '2', scadenzeSub: 'entro 30g',
  terapie: [
    {n:'Keppra 500mg', c:'#F7295A', o:'08:00'},
    {n:'Depakine', c:'#00BFA6', o:'13:00'},
    {n:'Keppra 750', c:'#7B5EA7', o:'20:00'},
  ],
  scadenzeMed: [
    {n:'Keppra', g:'6g', c:'#F7295A'},
    {n:'Depakine', g:'18g', c:'#FFD93D'},
    {n:'Keppra 750', g:'25g', c:'#7B5EA7'},
  ],
  barsSettimana: [40,20,60,10,80,30,50],
  barsStats: [30,55,75,40,90,60,80],
}

export default function HomeScreen({ nomeUtente, frase, isDemo, onNavigate }) {
  const [timerSec, setTimerSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(new Date())
  const timerRef = useRef(null)

  const data = isDemo ? DEMO_DATA : REAL_DATA

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function startTimer() {
    if (running) return
    setRunning(true)
    timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }
  function stopTimer() { setRunning(false); clearInterval(timerRef.current) }
  function resetTimer() { stopTimer(); setTimerSec(0) }
  function fmt(s) {
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')
  }

  const giorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
  const mesi = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
  const dataStr = `${giorni[time.getDay()]} ${time.getDate()} ${mesi[time.getMonth()]} ${time.getFullYear()}`
  const timeStr = time.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit', second:'2-digit'})

  const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
  const shSm = '0 4px 16px rgba(2,21,63,0.08), 0 1px 5px rgba(0,0,0,0.04)'

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .app{background:#f3f4f7;min-height:100vh;min-height:100dvh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          padding-bottom:80px;width:100%;max-width:480px;margin:0 auto;}
        @media(min-width:1024px){
          .app{box-shadow:0 0 60px rgba(2,21,63,0.12);}
        }
      `}</style>

      <div className="app">

        {/* ── HERO CARD ── */}
        <div style={{padding:'12px 12px 0'}}>
          <div style={{background:'#fdfdfd', borderRadius:'22px', padding:'14px 18px 16px', boxShadow:sh}}>

            {/* Riga 1: Data + Ora in cima a destra */}
            <div style={{
              display:'flex', justifyContent:'flex-end', alignItems:'center',
              gap:'8px', marginBottom:'10px', marginTop:'-2px'
            }}>
              <span style={{fontSize:'10px', color:'#bec1cc', fontWeight:'600'}}>{dataStr}</span>
              <span style={{
                fontSize:'13px', fontWeight:'900', color:'#bec1cc',
                fontVariantNumeric:'tabular-nums', letterSpacing:'0.5px'
              }}>{timeStr}</span>
            </div>

            {/* Logo centrato grande */}
            <div style={{display:'flex', justifyContent:'center', marginBottom:'12px'}}>
              <img src="/DamiLogo.png" alt="logo" style={{
                width:'62px', height:'62px', borderRadius:'50%', objectFit:'cover',
                boxShadow:'0 6px 20px rgba(8,24,76,0.18)'
              }}/>
            </div>

            {/* Badge demo */}
            {isDemo && (
              <div style={{
                textAlign:'center', marginBottom:'8px'
              }}>
                <span style={{
                  background:'linear-gradient(135deg,#FFD93D,#FF8C42)',
                  color:'#5a3000', fontSize:'10px', fontWeight:'800',
                  padding:'3px 12px', borderRadius:'20px',
                  letterSpacing:'0.5px'
                }}>🎭 MODALITÀ DEMO</span>
              </div>
            )}

            {/* Saluto */}
            <div style={{
              fontSize:'clamp(22px,5vw,28px)', fontWeight:'900',
              color:'#08184c', letterSpacing:'-0.5px', marginBottom:'4px'
            }}>
              Ciao {nomeUtente || 'Damiano'}!
            </div>
            <div style={{
              fontSize:'clamp(11px,2.5vw,13px)', color:'#7c8088',
              marginBottom:'18px', lineHeight:'1.5', fontStyle:'italic'
            }}>
              {frase}
            </div>

            {/* Bottoni */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>

              {/* Avvia timer crisi */}
              <button
                onClick={() => { startTimer(); onNavigate && onNavigate('crisi') }}
                style={{
                  position:'relative', height:'50px', borderRadius:'50px',
                  border:'none', overflow:'hidden', cursor:'pointer',
                  boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
                }}>
                <div style={{position:'absolute', inset:0, background:'linear-gradient(135deg,#193f9e,#2e84e9)'}}/>
                {/* Motivo basso-sinistra */}
                <div style={{
                  position:'absolute', left:0, bottom:0,
                  width:'40px', height:'40px',
                  background:'linear-gradient(135deg,#FF5B8D,#FF9F3F)',
                  borderRadius:'0 50% 0 50px', opacity:0.75
                }}/>
                {/* Motivo alto-destra */}
                <div style={{
                  position:'absolute', right:0, top:0,
                  width:'30px', height:'30px',
                  background:'linear-gradient(135deg,#FFD93D,#FF8C42)',
                  borderRadius:'50px 0 50% 0', opacity:0.65
                }}/>
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  gap:'6px', color:'#fff',
                  fontSize:'clamp(12px,3vw,14px)', fontWeight:'800',
                  letterSpacing:'0.2px'
                }}>
                  <AlertTriangle size={15} color="#fff"/>
                  Avvia timer crisi
                </div>
              </button>

              {/* Soccorso */}
              <button
                onClick={() => window.location.href = 'tel:112'}
                style={{
                  height:'50px', borderRadius:'50px',
                  border:'2.5px solid #e53935', background:'#feffff',
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:'6px',
                  boxShadow:'0 4px 14px rgba(229,57,53,0.18)'
                }}>
                <Phone size={15} color="#e53935"/>
                <span style={{
                  fontSize:'clamp(12px,3vw,14px)', fontWeight:'900',
                  color:'#8B6914', letterSpacing:'0.5px',
                  textShadow:'0 1px 2px rgba(0,0,0,0.10)'
                }}>SOCCORSO</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MINI CARDS ── */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:'6px', padding:'8px 12px'
        }}>
          {[
            {Icon:AlertTriangle, ibg:'linear-gradient(135deg,#F7295A,#FF9F3F)',
              ish:'rgba(247,41,90,0.25)', label:'Ultima crisi',
              val:data.ultimaCrisi, sub:data.ultimaCrisiSub,
              bar:'linear-gradient(90deg,#F7295A,#FF8C42)'},
            {Icon:Clock, ibg:'linear-gradient(135deg,#00BFA6,#2e84e9)',
              ish:'rgba(0,191,166,0.25)', label:'Prossima terapia',
              val:data.prossimaTerapia, sub:data.prossimaTerapiaSub,
              bar:'linear-gradient(90deg,#00BFA6,#2e84e9)'},
            {Icon:Bell, ibg:'linear-gradient(135deg,#FFD93D,#FF8C42)',
              ish:'rgba(255,140,66,0.25)', label:'Scadenze',
              val:data.scadenze, sub:data.scadenzeSub,
              bar:'linear-gradient(90deg,#FFD93D,#FF8C42)'},
          ].map(({Icon,ibg,ish,label,val,sub,bar},i) => (
            <div key={i} style={{
              background:'#feffff', borderRadius:'14px', overflow:'hidden',
              boxShadow:'0 4px 16px rgba(2,21,63,0.09), 0 1px 5px rgba(0,0,0,0.04)'
            }}>
              <div style={{padding:'8px 7px 6px'}}>
                <div style={{
                  width:'26px', height:'26px', borderRadius:'8px',
                  background:ibg, display:'flex', alignItems:'center',
                  justifyContent:'center', marginBottom:'6px',
                  boxShadow:`0 3px 10px ${ish}`
                }}>
                  <Icon size={13} color="#fff"/>
                </div>
                <div style={{
                  fontSize:'7.5px', color:'#7c8088', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'2px'
                }}>{label}</div>
                <div style={{
                  fontSize:'clamp(14px,3.5vw,16px)', fontWeight:'900',
                  color:'#02153f', lineHeight:1
                }}>{val}</div>
                <div style={{fontSize:'8.5px', color:'#bec1cc', marginTop:'2px'}}>{sub}</div>
              </div>
              <div style={{height:'3px', background:bar}}/>
            </div>
          ))}
        </div>

        {/* ── PRIORITÀ RAPIDE ── */}
        <div style={{padding:'0 12px', marginBottom:'10px'}}>
          <div style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'8px'
          }}>
            <span style={{fontSize:'14px', fontWeight:'800', color:'#02153f'}}>
              "Priorità rapide"
            </span>
            <div style={{display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}>
              <Pencil size={11} color="#2e84e9"/>
              <span style={{fontSize:'11px', color:'#2e84e9', fontWeight:'700'}}>Personalizza</span>
            </div>
          </div>
          {[
            {Icon:AlertTriangle, bg:'linear-gradient(135deg,#F7295A,#FF8C42)',
              sh:'rgba(247,41,90,0.2)', title:'Registra crisi ora',
              sub:'Timer in tempo reale', page:'crisi'},
            {Icon:Pill, bg:'linear-gradient(135deg,#00BFA6,#2e84e9)',
              sh:'rgba(0,191,166,0.2)', title:'Terapie programmate',
              sub:'Prossima alle '+data.prossimaTerapia, page:'terapie'},
            {Icon:Droplets, bg:'linear-gradient(135deg,#7B5EA7,#2e84e9)',
              sh:'rgba(123,94,167,0.2)', title:'Toilet Training',
              sub:'Log giornaliero', page:'toilet'},
          ].map(({Icon,bg,sh,title,sub,page},i) => (
            <div key={i} onClick={() => onNavigate && onNavigate(page)} style={{
              background:'#feffff', borderRadius:'14px',
              padding:'11px 14px', display:'flex', alignItems:'center',
              gap:'12px', marginBottom:'7px', boxShadow:shSm, cursor:'pointer'
            }}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background:bg, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0,
                boxShadow:`0 4px 12px ${sh}`
              }}>
                <Icon size={16} color="#fff"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'13px', fontWeight:'700', color:'#02153f'}}>{title}</div>
                <div style={{fontSize:'10px', color:'#7c8088', marginTop:'1px'}}>{sub}</div>
              </div>
              <ChevronRight size={16} color="#2e84e9"/>
            </div>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        <div style={{padding:'0 12px', marginBottom:'10px'}}>
          <div style={{fontSize:'14px', fontWeight:'800', color:'#02153f', marginBottom:'8px'}}>
            "Dashboard"
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>

            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Statistiche</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'34px'}}>
                {data.barsStats.map((h,i) => (
                  <div key={i} style={{
                    flex:1, height:`${h}%`, borderRadius:'3px 3px 0 0', opacity:0.8,
                    background:['#193f9e','#7B5EA7','#F7295A','#00BFA6','#193f9e','#FFD93D','#7B5EA7'][i]
                  }}/>
                ))}
              </div>
              <div style={{display:'flex', marginTop:'3px'}}>
                {['L','M','M','G','V','S','D'].map((d,i) => (
                  <span key={i} style={{flex:1,textAlign:'center',fontSize:'7px',color:'#bec1cc'}}>{d}</span>
                ))}
              </div>
            </div>

            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Prossime terapie</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              {data.terapie.map((t,i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'3px 0',
                  borderBottom: i<2 ? '1px solid #f0f1f4' : 'none'
                }}>
                  <div style={{width:'6px', height:'6px', borderRadius:'50%', background:t.c, flexShrink:0}}/>
                  <span style={{fontSize:'10px', color:'#394058', fontWeight:'600', flex:1,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.n}</span>
                  <span style={{fontSize:'9px', color:'#bec1cc'}}>{t.o}</span>
                </div>
              ))}
            </div>

            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Crisi settimana</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'34px'}}>
                {data.barsSettimana.map((h,i) => (
                  <div key={i} style={{
                    flex:1, height:`${h}%`, borderRadius:'3px 3px 0 0', opacity:0.75,
                    background:['#193f9e','#7B5EA7','#F7295A','#193f9e','#F7295A','#7B5EA7','#193f9e'][i]
                  }}/>
                ))}
              </div>
              <div style={{display:'flex', marginTop:'3px'}}>
                {['L','M','M','G','V','S','D'].map((d,i) => (
                  <span key={i} style={{flex:1,textAlign:'center',fontSize:'7px',color:'#bec1cc'}}>{d}</span>
                ))}
              </div>
            </div>

            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Scadenze medicinali</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              {data.scadenzeMed.map((m,i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'3px 0',
                  borderBottom: i<2 ? '1px solid #f0f1f4' : 'none'
                }}>
                  <div style={{width:'6px', height:'6px', borderRadius:'50%', background:m.c, flexShrink:0}}/>
                  <span style={{fontSize:'10px', color:'#394058', fontWeight:'600', flex:1}}>{m.n}</span>
                  <span style={{
                    fontSize:'9px', fontWeight:'700', padding:'1px 6px', borderRadius:'20px',
                    background: i===0 ? '#FEF0F4' : '#f3f4f7',
                    color: i===0 ? '#F7295A' : '#7c8088'
                  }}>{m.g}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── TIMER ── */}
        <div style={{padding:'0 12px'}}>
          <div style={{background:'#feffff', borderRadius:'20px', padding:'16px', boxShadow:sh}}>
            <div style={{fontSize:'14px', fontWeight:'800', color:'#02153f', marginBottom:'8px'}}>
              ⏱ Registrazione crisi
            </div>
            <div style={{
              fontSize:'clamp(36px,10vw,46px)', fontWeight:'900', textAlign:'center',
              color:'#02153f', letterSpacing:'-2px',
              fontVariantNumeric:'tabular-nums', marginBottom:'4px'
            }}>
              {fmt(timerSec)}
            </div>
            <div style={{
              textAlign:'center', fontSize:'11px', marginBottom:'14px',
              color: running ? '#F7295A' : '#bec1cc',
              fontWeight: running ? '700' : '400'
            }}>
              {running ? '🔴 Crisi in corso...' : 'Premi ▶ per avviare'}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap:'14px'}}>
              <button onClick={startTimer} style={{
                width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 18px rgba(25,63,158,0.38)'
              }}><Play size={19} color="#fff" fill="#fff"/></button>
              <button onClick={stopTimer} style={{
                width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#F7295A,#FF8C42)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 18px rgba(247,41,90,0.32)'
              }}><Square size={19} color="#fff" fill="#fff"/></button>
              <button onClick={resetTimer} style={{
                width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
              }}><RotateCcw size={19} color="#7c8088"/></button>
            </div>
          </div>
        </div>

        {/* ── NAVBAR ── */}
        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          background:'#feffff', borderTop:'1px solid #f0f1f4',
          display:'flex', padding:'7px 0 14px',
          boxShadow:'0 -4px 16px rgba(2,21,63,0.08)'
        }}>
          {[
            {Icon:Home, label:'Home', page:'home', act:true},
            {Icon:BookOpen, label:'Diario', page:'diario'},
            {Icon:Pill, label:'Terapie', page:'terapie'},
            {Icon:Droplets, label:'Toilet', page:'toilet'},
            {Icon:BarChart2, label:'Report', page:'report'},
            {Icon:Settings, label:'Altro', page:'altro'},
          ].map(({Icon,label,page,act},i) => (
            <div key={i} onClick={() => onNavigate && onNavigate(page)} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:'3px', cursor:'pointer'
            }}>
              <div style={{
                width:'34px', height:'24px', display:'flex',
                alignItems:'center', justifyContent:'center',
                borderRadius:'8px', background: act ? '#EEF3FD' : 'transparent'
              }}>
                <Icon size={17} color={act ? '#193f9e' : '#bec1cc'}/>
              </div>
              <span style={{
                fontSize:'9px', fontWeight: act ? '800' : '500',
                color: act ? '#193f9e' : '#bec1cc'
              }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}