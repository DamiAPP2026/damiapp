import { useState, useEffect, useRef } from 'react'
import {
  ChevronRight, Pencil, Play, Square, RotateCcw,
  Home, BookOpen, Pill, Droplets, BarChart2, Settings,
  AlertTriangle, Clock, Bell, Phone
} from 'lucide-react'

export default function HomeScreen({ nomeUtente, frase }) {
  const [timerSec, setTimerSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(new Date())
  const timerRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function startTimer() {
    if (running) return
    setRunning(true)
    timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }
  function stopTimer() {
    setRunning(false)
    clearInterval(timerRef.current)
  }
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
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f4f7; }
        .app-wrap {
          background: #f3f4f7;
          min-height: 100vh;
          min-height: 100dvh;
          font-family: -apple-system, 'Segoe UI', sans-serif;
          padding-bottom: 80px;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .app-wrap { max-width: 540px; }
          .hero-card { padding: 24px 22px 20px !important; }
          .mini-cards { gap: 10px !important; padding: 12px 16px !important; }
          .section-pad { padding: 0 16px !important; }
        }
        @media (min-width: 1024px) {
          .app-wrap { max-width: 420px; box-shadow: 0 0 60px rgba(2,21,63,0.12); }
        }
      `}</style>

      <div className="app-wrap">

        {/* ── HERO CARD ── */}
        <div style={{padding:'12px 12px 0'}}>
          <div className="hero-card" style={{
            background:'#feffff', borderRadius:'22px',
            padding:'18px 18px 16px', boxShadow:sh
          }}>

            {/* Riga 1: Logo centrato + Data/Ora a destra */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr auto 1fr',
              alignItems:'center',
              marginBottom:'14px'
            }}>
              {/* Spazio sinistra (vuoto per bilanciare) */}
              <div/>

              {/* Logo + DamiAPP centrati */}
              <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                <img src="/DamiLogo.png" alt="logo" style={{
                  width:'34px', height:'34px', borderRadius:'50%', objectFit:'cover'
                }}/>
                <span style={{
                  fontSize:'15px', fontWeight:'800', color:'#0d2055',
                  letterSpacing:'-0.2px'
                }}>DamiAPP</span>
              </div>

              {/* Data + Ora a destra */}
              <div style={{
                display:'flex', flexDirection:'row', alignItems:'center',
                justifyContent:'flex-end', gap:'6px'
              }}>
                <span style={{
                  fontSize:'9px', color:'#bec1cc', fontWeight:'600',
                  whiteSpace:'nowrap'
                }}>{dataStr}</span>
                <span style={{
                  fontSize:'13px', fontWeight:'900', color:'#02153f',
                  letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums',
                  whiteSpace:'nowrap'
                }}>{timeStr}</span>
              </div>
            </div>

            {/* Saluto */}
            <div style={{
              fontSize:'clamp(22px, 5vw, 28px)', fontWeight:'900',
              color:'#02153f', letterSpacing:'-0.5px', marginBottom:'4px'
            }}>
              Ciao {nomeUtente || 'Damiano'}!
            </div>
            <div style={{
              fontSize:'clamp(11px, 2.5vw, 13px)', color:'#bec1cc',
              marginBottom:'18px', lineHeight:'1.5', fontStyle:'italic'
            }}>
              {frase}
            </div>

            {/* Bottoni */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>

              {/* Avvia timer crisi */}
              <button onClick={startTimer} style={{
                position:'relative', height:'46px', borderRadius:'50px',
                border:'none', overflow:'hidden', cursor:'pointer',
                boxShadow:'0 6px 20px rgba(25,63,158,0.35)'
              }}>
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(135deg,#193f9e,#2e84e9)'
                }}/>
                <div style={{
                  position:'absolute', left:'-8px', bottom:'-8px',
                  width:'42px', height:'42px', borderRadius:'50%',
                  background:'radial-gradient(circle,#FF5B8D,#FF9F3F,transparent)',
                  opacity:0.8
                }}/>
                <div style={{
                  position:'absolute', right:'-6px', top:'-6px',
                  width:'36px', height:'36px', borderRadius:'50%',
                  background:'radial-gradient(circle,#FFD93D,#FF8C42,transparent)',
                  opacity:0.7
                }}/>
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  gap:'6px', color:'#fff',
                  fontSize:'clamp(10px, 2.5vw, 12px)', fontWeight:'800'
                }}>
                  <AlertTriangle size={13} color="#fff"/>
                  Avvia timer crisi
                </div>
              </button>

              {/* Soccorso */}
              <button
                onClick={() => window.location.href = 'tel:112'}
                style={{
                  height:'46px', borderRadius:'50px',
                  border:'2.5px solid #e53935', background:'#feffff',
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:'6px',
                  boxShadow:'0 4px 14px rgba(229,57,53,0.18)'
                }}
              >
                <Phone size={13} color="#e53935"/>
                <span style={{
                  fontSize:'clamp(11px, 2.5vw, 13px)', fontWeight:'900',
                  color:'#8B6914',
                  textShadow:'0 1px 2px rgba(0,0,0,0.12)',
                  letterSpacing:'0.3px'
                }}>SOCCORSO</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MINI CARDS ── */}
        <div className="mini-cards" style={{
          display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:'7px', padding:'10px 12px'
        }}>
          {[
            {
              Icon:AlertTriangle,
              ibg:'linear-gradient(135deg,#F7295A,#FF9F3F)',
              ish:'rgba(247,41,90,0.28)',
              label:'Ultima crisi', val:'26g', sub:'al 20/03',
              bar:'linear-gradient(90deg,#F7295A,#FF8C42)'
            },
            {
              Icon:Clock,
              ibg:'linear-gradient(135deg,#00BFA6,#2e84e9)',
              ish:'rgba(0,191,166,0.28)',
              label:'Prossima terapia', val:'20:00', sub:'Keppra',
              bar:'linear-gradient(90deg,#00BFA6,#2e84e9)'
            },
            {
              Icon:Bell,
              ibg:'linear-gradient(135deg,#FFD93D,#FF8C42)',
              ish:'rgba(255,140,66,0.28)',
              label:'Scadenze', val:'2', sub:'entro 30g',
              bar:'linear-gradient(90deg,#FFD93D,#FF8C42)'
            },
          ].map(({Icon,ibg,ish,label,val,sub,bar},i) => (
            <div key={i} style={{
              background:'#feffff', borderRadius:'16px', overflow:'hidden',
              boxShadow:'0 6px 20px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{padding:'10px 8px 7px'}}>
                <div style={{
                  width:'30px', height:'30px', borderRadius:'10px',
                  background:ibg, display:'flex', alignItems:'center',
                  justifyContent:'center', marginBottom:'7px',
                  boxShadow:`0 4px 12px ${ish}`
                }}>
                  <Icon size={14} color="#fff"/>
                </div>
                <div style={{
                  fontSize:'8px', color:'#7c8088', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  marginBottom:'3px'
                }}>{label}</div>
                <div style={{
                  fontSize:'clamp(15px, 4vw, 18px)', fontWeight:'900',
                  color:'#02153f', lineHeight:1
                }}>{val}</div>
                <div style={{fontSize:'9px', color:'#bec1cc', marginTop:'2px'}}>{sub}</div>
              </div>
              <div style={{height:'3px', background:bar}}/>
            </div>
          ))}
        </div>

        {/* ── PRIORITÀ RAPIDE ── */}
        <div className="section-pad" style={{padding:'0 12px', marginBottom:'12px'}}>
          <div style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'10px'
          }}>
            <span style={{
              fontSize:'clamp(13px, 3vw, 15px)', fontWeight:'800', color:'#02153f'
            }}>"Priorità rapide"</span>
            <div style={{display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}>
              <Pencil size={11} color="#2e84e9"/>
              <span style={{fontSize:'11px', color:'#2e84e9', fontWeight:'700'}}>Personalizza</span>
            </div>
          </div>
          {[
            {
              Icon:AlertTriangle,
              bg:'linear-gradient(135deg,#F7295A,#FF8C42)',
              sh:'rgba(247,41,90,0.2)',
              title:'Registra crisi ora', sub:'Timer in tempo reale'
            },
            {
              Icon:Pill,
              bg:'linear-gradient(135deg,#00BFA6,#2e84e9)',
              sh:'rgba(0,191,166,0.2)',
              title:'Terapie programmate', sub:'Prossima alle 20:00'
            },
            {
              Icon:Droplets,
              bg:'linear-gradient(135deg,#7B5EA7,#2e84e9)',
              sh:'rgba(123,94,167,0.2)',
              title:'Toilet Training', sub:'Log giornaliero'
            },
          ].map(({Icon,bg,sh,title,sub},i) => (
            <div key={i} style={{
              background:'#feffff', borderRadius:'14px',
              padding:'12px 14px', display:'flex', alignItems:'center',
              gap:'12px', marginBottom:'7px', boxShadow:shSm, cursor:'pointer'
            }}>
              <div style={{
                width:'38px', height:'38px', borderRadius:'50%',
                background:bg, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0,
                boxShadow:`0 4px 12px ${sh}`
              }}>
                <Icon size={17} color="#fff"/>
              </div>
              <div style={{flex:1}}>
                <div style={{
                  fontSize:'clamp(12px, 3vw, 13px)', fontWeight:'700', color:'#02153f'
                }}>{title}</div>
                <div style={{fontSize:'10px', color:'#7c8088', marginTop:'1px'}}>{sub}</div>
              </div>
              <ChevronRight size={16} color="#2e84e9"/>
            </div>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        <div className="section-pad" style={{padding:'0 12px', marginBottom:'12px'}}>
          <div style={{
            fontSize:'clamp(13px, 3vw, 15px)', fontWeight:'800',
            color:'#02153f', marginBottom:'10px'
          }}>"Dashboard"</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>

            {/* Statistiche */}
            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Statistiche</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'36px'}}>
                {[40,65,85,50,100,70,90].map((h,i) => (
                  <div key={i} style={{
                    flex:1, height:`${h}%`, borderRadius:'3px 3px 0 0', opacity:0.8,
                    background:['#193f9e','#7B5EA7','#F7295A','#00BFA6','#193f9e','#FFD93D','#7B5EA7'][i]
                  }}/>
                ))}
              </div>
              <div style={{display:'flex', marginTop:'3px'}}>
                {['L','M','M','G','V','S','D'].map((d,i) => (
                  <span key={i} style={{flex:1, textAlign:'center', fontSize:'7px', color:'#bec1cc'}}>{d}</span>
                ))}
              </div>
            </div>

            {/* Prossime terapie */}
            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Prossime terapie</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              {[
                {n:'Keppra 500mg', c:'#F7295A', o:'08:00'},
                {n:'Depakine', c:'#00BFA6', o:'13:00'},
                {n:'Keppra 750', c:'#7B5EA7', o:'20:00'},
              ].map((t,i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'4px 0',
                  borderBottom: i<2 ? '1px solid #f0f1f4' : 'none'
                }}>
                  <div style={{width:'6px', height:'6px', borderRadius:'50%', background:t.c, flexShrink:0}}/>
                  <span style={{fontSize:'10px', color:'#394058', fontWeight:'600', flex:1,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.n}</span>
                  <span style={{fontSize:'9px', color:'#bec1cc'}}>{t.o}</span>
                </div>
              ))}
            </div>

            {/* Crisi settimana */}
            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Crisi settimana</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'36px'}}>
                {[60,30,80,20,100,50,70].map((h,i) => (
                  <div key={i} style={{
                    flex:1, height:`${h}%`, borderRadius:'3px 3px 0 0', opacity:0.75,
                    background:['#193f9e','#7B5EA7','#F7295A','#193f9e','#F7295A','#7B5EA7','#193f9e'][i]
                  }}/>
                ))}
              </div>
              <div style={{display:'flex', marginTop:'3px'}}>
                {['L','M','M','G','V','S','D'].map((d,i) => (
                  <span key={i} style={{flex:1, textAlign:'center', fontSize:'7px', color:'#bec1cc'}}>{d}</span>
                ))}
              </div>
            </div>

            {/* Scadenze medicinali */}
            <div style={{background:'#feffff', borderRadius:'16px', padding:'12px', boxShadow:shSm}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'11px', fontWeight:'800', color:'#02153f'}}>Scadenze medicinali</span>
                <ChevronRight size={12} color="#2e84e9"/>
              </div>
              {[
                {n:'Keppra', g:'6g', c:'#F7295A'},
                {n:'Depakine', g:'18g', c:'#FFD93D'},
                {n:'Keppra 750', g:'25g', c:'#7B5EA7'},
              ].map((m,i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'4px 0',
                  borderBottom: i<2 ? '1px solid #f0f1f4' : 'none'
                }}>
                  <div style={{width:'6px', height:'6px', borderRadius:'50%', background:m.c, flexShrink:0}}/>
                  <span style={{fontSize:'10px', color:'#394058', fontWeight:'600', flex:1}}>{m.n}</span>
                  <span style={{
                    fontSize:'9px', fontWeight:'700', padding:'1px 6px', borderRadius:'20px',
                    background: m.g==='6g' ? '#FEF0F4' : '#f3f4f7',
                    color: m.g==='6g' ? '#F7295A' : '#7c8088'
                  }}>{m.g}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── TIMER ── */}
        <div className="section-pad" style={{padding:'0 12px'}}>
          <div style={{
            background:'#feffff', borderRadius:'20px',
            padding:'18px 16px', boxShadow:sh
          }}>
            <div style={{
              fontSize:'clamp(13px, 3vw, 15px)', fontWeight:'800',
              color:'#02153f', marginBottom:'8px'
            }}>
              ⏱ Registrazione crisi
            </div>
            <div style={{
              fontSize:'clamp(36px, 10vw, 46px)', fontWeight:'900',
              textAlign:'center', color:'#02153f', letterSpacing:'-2px',
              fontVariantNumeric:'tabular-nums', marginBottom:'4px'
            }}>
              {fmt(timerSec)}
            </div>
            <div style={{
              textAlign:'center', fontSize:'11px', marginBottom:'16px',
              color: running ? '#F7295A' : '#bec1cc',
              fontWeight: running ? '700' : '400'
            }}>
              {running ? '🔴 Crisi in corso...' : 'Premi ▶ per avviare'}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap:'14px'}}>
              <button onClick={startTimer} style={{
                width:'48px', height:'48px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 18px rgba(25,63,158,0.38)'
              }}><Play size={20} color="#fff" fill="#fff"/></button>
              <button onClick={stopTimer} style={{
                width:'48px', height:'48px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#F7295A,#FF8C42)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 18px rgba(247,41,90,0.32)'
              }}><Square size={20} color="#fff" fill="#fff"/></button>
              <button onClick={resetTimer} style={{
                width:'48px', height:'48px', borderRadius:'50%', border:'none', cursor:'pointer',
                background:'#f3f4f7', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
              }}><RotateCcw size={20} color="#7c8088"/></button>
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
            {Icon:Home, label:'Home', act:true},
            {Icon:BookOpen, label:'Diario'},
            {Icon:Pill, label:'Terapie'},
            {Icon:Droplets, label:'Toilet'},
            {Icon:BarChart2, label:'Report'},
            {Icon:Settings, label:'Altro'},
          ].map(({Icon,label,act},i) => (
            <div key={i} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:'3px', cursor:'pointer'
            }}>
              <div style={{
                width:'34px', height:'24px', display:'flex',
                alignItems:'center', justifyContent:'center',
                borderRadius:'8px',
                background: act ? '#EEF3FD' : 'transparent'
              }}>
                <Icon size={17} color={act ? '#193f9e' : '#bec1cc'}/>
              </div>
              <span style={{
                fontSize:'9px',
                fontWeight: act ? '800' : '500',
                color: act ? '#193f9e' : '#bec1cc'
              }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}