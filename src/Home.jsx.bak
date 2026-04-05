import { useState, useRef } from 'react'
import { 
  AlertCircle, Pill, Package, Play, Square, RotateCcw,
  Home, BookOpen, Droplets, BarChart2, Settings, ChevronRight,
  Pencil, Clock, Bell
} from 'lucide-react'

export default function HomeScreen() {
  const [timerSec, setTimerSec] = useState(0)
  const [running, setRunning] = useState(false)
  const interval = useRef(null)

  function startTimer() {
    if (running) return
    setRunning(true)
    interval.current = setInterval(() => setTimerSec(s => s + 1), 1000)
  }
  function stopTimer() {
    setRunning(false)
    clearInterval(interval.current)
  }
  function resetTimer() {
    stopTimer()
    setTimerSec(0)
  }
  function fmt(s) {
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
      .map(n => String(n).padStart(2,'0')).join(':')
  }

  const card = (children, extra={}) => ({
    background:'#fff',
    borderRadius:'18px',
    boxShadow:'0 4px 20px rgba(74,108,247,0.09), 0 1px 6px rgba(0,0,0,0.05)',
    ...extra
  })

  return (
    <div style={{
      background:'#F0F4FF', minHeight:'100vh',
      fontFamily:"-apple-system,'Segoe UI',sans-serif",
      paddingBottom:'80px', maxWidth:'430px', margin:'0 auto'
    }}>

      {/* ── HERO CARD ── */}
      <div style={{padding:'12px 12px 0'}}>
        <div style={card({}, {padding:'20px 18px 18px'})}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
            <img src="/DamiLogo.png" alt="logo" style={{
              width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover'
            }}/>
            <span style={{fontSize:'15px', fontWeight:'800', color:'#1A1F3A'}}>DamiAPP</span>
          </div>
          <div style={{fontSize:'26px', fontWeight:'900', color:'#1A1F3A', letterSpacing:'-0.5px', marginBottom:'4px'}}>
            Ciao Damiano!
          </div>
          <div style={{fontSize:'13px', color:'#8A94B2', marginBottom:'18px', lineHeight:'1.4'}}>
            Tieni sotto controllo crisi e terapie
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <button onClick={startTimer} style={{
              position:'relative', height:'44px', borderRadius:'50px',
              border:'none', overflow:'hidden', cursor:'pointer',
              boxShadow:'0 6px 18px rgba(74,108,247,0.38)'
            }}>
              <div style={{position:'absolute', inset:0, background:'linear-gradient(110deg,#4A6CF7,#7B5EA7)'}}/>
              <div style={{position:'absolute', left:'-8px', top:'-8px', width:'50px', height:'50px',
                borderRadius:'50%', background:'radial-gradient(circle at 40% 45%,#FF5B8D,#FF9F3F 50%,transparent)', opacity:0.9}}/>
              <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center',
                justifyContent:'center', gap:'6px', color:'#fff', fontSize:'12px', fontWeight:'800'}}>
                <AlertCircle size={14} color="#fff"/> Avvia timer crisi
              </div>
            </button>
            <button style={{
              height:'44px', borderRadius:'50px', border:'2px solid #4A6CF7',
              background:'#fff', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center', gap:'6px'
            }}>
              <Pill size={14} color="#4A6CF7"/>
              <span style={{fontSize:'13px', fontWeight:'700', color:'#4A6CF7'}}>Terapie</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MINI CARDS ── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', padding:'10px 12px'}}>
        {[
          {Icon:AlertCircle, ibg:'linear-gradient(135deg,#F7295A,#FF9F3F)', ish:'rgba(247,41,90,0.28)',
            label:'Ultima crisi', val:'26g', sub:'al 20/03', bar:'linear-gradient(90deg,#F7295A,#FF8C42)'},
          {Icon:Clock, ibg:'linear-gradient(135deg,#00BFA6,#4A6CF7)', ish:'rgba(0,191,166,0.28)',
            label:'Prossima terapia', val:'20:00', sub:'Keppra', bar:'linear-gradient(90deg,#00BFA6,#4A6CF7)'},
          {Icon:Bell, ibg:'linear-gradient(135deg,#FFD93D,#FF8C42)', ish:'rgba(255,140,66,0.28)',
            label:'Scadenze', val:'2', sub:'entro 30g', bar:'linear-gradient(90deg,#FFD93D,#FF8C42)'},
        ].map(({Icon, ibg, ish, label, val, sub, bar}, i) => (
          <div key={i} style={{background:'#fff', borderRadius:'16px', overflow:'hidden',
            boxShadow:'0 4px 16px rgba(0,0,0,0.08), 0 1px 5px rgba(0,0,0,0.04)'}}>
            <div style={{padding:'12px 10px 8px'}}>
              <div style={{
                width:'34px', height:'34px', borderRadius:'10px',
                background:ibg, display:'flex', alignItems:'center',
                justifyContent:'center', marginBottom:'8px',
                boxShadow:`0 3px 10px ${ish}`
              }}>
                <Icon size={16} color="#fff"/>
              </div>
              <div style={{fontSize:'9px', color:'#8A94B2', fontWeight:'700',
                textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'3px'}}>{label}</div>
              <div style={{fontSize:'19px', fontWeight:'900', color:'#1A1F3A', lineHeight:1}}>{val}</div>
              <div style={{fontSize:'9px', color:'#bbb', marginTop:'2px'}}>{sub}</div>
            </div>
            <div style={{height:'3.5px', background:bar}}/>
          </div>
        ))}
      </div>

      {/* ── PRIORITÀ RAPIDE ── */}
      <div style={{padding:'0 12px', marginBottom:'12px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
          <span style={{fontSize:'15px', fontWeight:'800', color:'#1A1F3A'}}>"Priorità rapide"</span>
          <div style={{display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}>
            <Pencil size={11} color="#4A6CF7"/>
            <span style={{fontSize:'11px', color:'#4A6CF7', fontWeight:'700'}}>Personalizza</span>
          </div>
        </div>
        {[
          {Icon:AlertCircle, bg:'linear-gradient(135deg,#F7295A,#FF8C42)', sh:'rgba(247,41,90,0.25)',
            title:'Registra crisi ora', sub:'Timer in tempo reale'},
          {Icon:Pill, bg:'linear-gradient(135deg,#00BFA6,#4A6CF7)', sh:'rgba(0,191,166,0.25)',
            title:'Terapie programmate', sub:'Prossima alle 20:00'},
          {Icon:Droplets, bg:'linear-gradient(135deg,#7B5EA7,#4A6CF7)', sh:'rgba(123,94,167,0.25)',
            title:'Toilet Training', sub:'Log giornaliero'},
        ].map(({Icon, bg, sh, title, sub}, i) => (
          <div key={i} style={{
            ...card({}, {padding:'12px 14px'}),
            display:'flex', alignItems:'center', gap:'12px',
            marginBottom:'8px', cursor:'pointer'
          }}>
            <div style={{
              width:'38px', height:'38px', borderRadius:'50%',
              background:bg, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0,
              boxShadow:`0 4px 12px ${sh}`
            }}>
              <Icon size={18} color="#fff"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px', fontWeight:'700', color:'#1A1F3A'}}>{title}</div>
              <div style={{fontSize:'10px', color:'#8A94B2', marginTop:'1px'}}>{sub}</div>
            </div>
            <ChevronRight size={16} color="#4A6CF7"/>
          </div>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      <div style={{padding:'0 12px', marginBottom:'12px'}}>
        <div style={{fontSize:'15px', fontWeight:'800', color:'#1A1F3A', marginBottom:'10px'}}>"Dashboard"</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>

          <div style={card({}, {padding:'12px'})}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <span style={{fontSize:'11px', fontWeight:'800', color:'#1A1F3A'}}>Statistiche</span>
              <ChevronRight size={12} color="#4A6CF7"/>
            </div>
            <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'38px'}}>
              {[40,65,85,50,100,70,90].map((h,i) => (
                <div key={i} style={{flex:1, height:`${h}%`, borderRadius:'2px 2px 0 0',
                  background:['#4A6CF7','#7B5EA7','#F7295A','#00BFA6','#4A6CF7','#FFD93D','#7B5EA7'][i], opacity:0.75}}/>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'3px'}}>
              {['L','M','M','G','V','S','D'].map((d,i) => (
                <span key={i} style={{flex:1, textAlign:'center', fontSize:'7px', color:'#bbb'}}>{d}</span>
              ))}
            </div>
          </div>

          <div style={card({}, {padding:'12px'})}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <span style={{fontSize:'11px', fontWeight:'800', color:'#1A1F3A'}}>Prossime terapie</span>
              <ChevronRight size={12} color="#4A6CF7"/>
            </div>
            {[{n:'Keppra 500mg',c:'#F7295A'},{n:'Depakine',c:'#00BFA6'},{n:'Keppra 750mg',c:'#7B5EA7'}].map((t,i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:'6px', padding:'4px 0',
                borderBottom: i<2 ? '1px solid #EDF0F8' : 'none'}}>
                <div style={{width:'6px', height:'6px', borderRadius:'50%', background:t.c, flexShrink:0}}/>
                <span style={{fontSize:'10px', color:'#444', fontWeight:'500', flex:1,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.n}</span>
                <ChevronRight size={10} color="#bbb"/>
              </div>
            ))}
          </div>

          <div style={card({}, {padding:'12px'})}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <span style={{fontSize:'11px', fontWeight:'800', color:'#1A1F3A'}}>Crisi settimana</span>
              <ChevronRight size={12} color="#4A6CF7"/>
            </div>
            <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'38px'}}>
              {[60,30,80,20,100,50,70].map((h,i) => (
                <div key={i} style={{flex:1, height:`${h}%`, borderRadius:'2px 2px 0 0',
                  background:['#4A6CF7','#7B5EA7','#F7295A','#4A6CF7','#F7295A','#7B5EA7','#4A6CF7'][i], opacity:0.7}}/>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'3px'}}>
              {['L','M','M','G','V','S','D'].map((d,i) => (
                <span key={i} style={{flex:1, textAlign:'center', fontSize:'7px', color:'#bbb'}}>{d}</span>
              ))}
            </div>
          </div>

          <div style={card({}, {padding:'12px'})}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <span style={{fontSize:'11px', fontWeight:'800', color:'#1A1F3A'}}>Scadenze medicinali</span>
              <ChevronRight size={12} color="#4A6CF7"/>
            </div>
            {[{n:'Keppra',g:'6g',c:'#F7295A'},{n:'Depakine',g:'18g',c:'#FFD93D'},{n:'Keppra 750',g:'25g',c:'#7B5EA7'}].map((m,i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:'6px', padding:'4px 0',
                borderBottom: i<2 ? '1px solid #EDF0F8' : 'none'}}>
                <div style={{width:'6px', height:'6px', borderRadius:'50%', background:m.c, flexShrink:0}}/>
                <span style={{fontSize:'10px', color:'#444', fontWeight:'500', flex:1}}>{m.n}</span>
                <span style={{fontSize:'9px', color:'#8A94B2', fontWeight:'600'}}>{m.g}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── TIMER ── */}
      <div style={{padding:'0 12px'}}>
        <div style={card({}, {padding:'18px 16px'})}>
          <div style={{fontSize:'15px', fontWeight:'800', color:'#1A1F3A', marginBottom:'6px'}}>
            Registrazione crisi
          </div>
          <div style={{fontSize:'44px', fontWeight:'900', textAlign:'center',
            color:'#1A1F3A', letterSpacing:'-2px', fontVariantNumeric:'tabular-nums', marginBottom:'4px'}}>
            {fmt(timerSec)}
          </div>
          <div style={{textAlign:'center', fontSize:'10px', color:'#bbb', marginBottom:'14px'}}>
            {running ? '🔴 Crisi in corso...' : 'Premi ▶ per avviare'}
          </div>
          <div style={{display:'flex', justifyContent:'center', gap:'14px'}}>
            <button onClick={startTimer} style={{
              width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#4A6CF7,#7B5EA7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(74,108,247,0.38)'
            }}><Play size={18} color="#fff" fill="#fff"/></button>
            <button onClick={stopTimer} style={{
              width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#F7295A,#FF8C42)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(247,41,90,0.32)'
            }}><Square size={18} color="#fff" fill="#fff"/></button>
            <button onClick={resetTimer} style={{
              width:'46px', height:'46px', borderRadius:'50%', border:'none', cursor:'pointer',
              background:'#EEF3FD', display:'flex', alignItems:'center', justifyContent:'center'
            }}><RotateCcw size={18} color="#8A94B2"/></button>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, background:'#fff',
        borderTop:'1px solid #EDF0F8', display:'flex',
        padding:'6px 0 14px', boxShadow:'0 -3px 12px rgba(0,0,0,0.06)'
      }}>
        {[
          {Icon:Home, label:'Home', act:true},
          {Icon:BookOpen, label:'Diario'},
          {Icon:Pill, label:'Terapie'},
          {Icon:Droplets, label:'Toilet'},
          {Icon:BarChart2, label:'Report'},
          {Icon:Settings, label:'Altro'},
        ].map(({Icon, label, act}, i) => (
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', gap:'3px', cursor:'pointer'}}>
            <div style={{
              width:'32px', height:'24px', display:'flex', alignItems:'center',
              justifyContent:'center', borderRadius:'8px',
              background: act ? '#EEF3FD' : 'transparent'
            }}>
              <Icon size={16} color={act ? '#4A6CF7' : '#bbb'}/>
            </div>
            <span style={{fontSize:'9px', fontWeight: act ? '800' : '600',
              color: act ? '#4A6CF7' : '#bbb'}}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}