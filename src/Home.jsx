export default function Home() {
  return (
    <div style={{
      minHeight:'100vh', background:'#F0F2F8',
      fontFamily:"-apple-system,'Segoe UI',sans-serif",
      paddingBottom:'80px'
    }}>

      {/* HERO CARD */}
      <div style={{margin:'12px 12px 8px'}}>
        <div style={{
          background:'#fff', borderRadius:'22px',
          padding:'18px 16px', boxShadow:'0 6px 22px rgba(74,108,247,0.11)'
        }}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'8px'}}>
            <img src="/DamiLogo.png" style={{width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover'}} alt="logo"/>
            <span style={{fontSize:'14px', fontWeight:'900', color:'#1A1F3A'}}>DamiAPP</span>
          </div>
          <div style={{fontSize:'22px', fontWeight:'900', color:'#1A1F3A', textAlign:'center', marginBottom:'4px'}}>
            Ciao! 👋
          </div>
          <div style={{fontSize:'11px', color:'#8A94B2', textAlign:'center', marginBottom:'14px'}}>
            Benvenuto in DamiAPP
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            {/* Bottone Registra Crisi */}
            <div style={{
              position:'relative', height:'40px', borderRadius:'50px',
              overflow:'hidden', cursor:'pointer',
              boxShadow:'0 5px 14px rgba(74,108,247,0.36)'
            }}>
              <div style={{
                position:'absolute', inset:0,
                background:'linear-gradient(110deg,#4A6CF7,#7B5EA7)'
              }}/>
              <div style={{
                position:'absolute', left:'-8px', top:'-8px',
                width:'50px', height:'50px', borderRadius:'50%',
                background:'radial-gradient(circle at 40% 45%,#FF5B8D,#FF9F3F 50%,#FFD93D 78%,transparent)',
                opacity:0.9
              }}/>
              <div style={{
                position:'absolute', inset:0, display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:'12px', fontWeight:'800', color:'#fff', gap:'4px'
              }}>
                🚨 Registra Crisi
              </div>
            </div>
            {/* Bottone Toilet */}
            <div style={{
              height:'40px', borderRadius:'50px',
              border:'2px solid #4A6CF7', display:'flex',
              alignItems:'center', justifyContent:'center',
              gap:'6px', background:'#fff', cursor:'pointer'
            }}>
              <div style={{
                width:'20px', height:'20px', borderRadius:'50%',
                background:'linear-gradient(135deg,#00BFA6,#00D4C8)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'10px'
              }}>🚽</div>
              <span style={{fontSize:'11px', fontWeight:'700', color:'#4A6CF7'}}>
                Toilet Training
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MINI CARDS */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:'8px', padding:'0 12px', marginBottom:'10px'
      }}>
        {[
          {ico:'❗', label:'Ultima crisi', val:'26g', sub:'fa', bar:'linear-gradient(90deg,#F7295A,#FF8C42)', ibg:'linear-gradient(135deg,#F7295A,#FF9F3F)'},
          {ico:'💊', label:'Prossima terapia', val:'20:00', sub:'Keppra', bar:'linear-gradient(90deg,#00BFA6,#4A6CF7)', ibg:'linear-gradient(135deg,#00BFA6,#4A6CF7)'},
          {ico:'🎁', label:'Scadenze', val:'2', sub:'entro 30g', bar:'linear-gradient(90deg,#FFD93D,#FF8C42)', ibg:'linear-gradient(135deg,#FFD93D,#FF8C42)'},
        ].map((c,i) => (
          <div key={i} style={{background:'#fff', borderRadius:'14px', overflow:'hidden', boxShadow:'0 3px 12px rgba(0,0,0,0.07)'}}>
            <div style={{padding:'10px 8px 6px'}}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'8px',
                background:c.ibg, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'13px', marginBottom:'6px',
                boxShadow:'0 3px 7px rgba(0,0,0,0.11)'
              }}>{c.ico}</div>
              <div style={{fontSize:'7.5px', color:'#8A94B2', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'2px'}}>{c.label}</div>
              <div style={{fontSize:'16px', fontWeight:'900', color:'#1A1F3A'}}>{c.val}</div>
              <div style={{fontSize:'8px', color:'#bbb'}}>{c.sub}</div>
            </div>
            <div style={{height:'4px', background:c.bar}}/>
          </div>
        ))}
      </div>

      {/* PRIORITÀ RAPIDE */}
      <div style={{padding:'0 12px', marginBottom:'10px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
          <span style={{fontSize:'13px', fontWeight:'800', color:'#1A1F3A'}}>"Priorità rapide"</span>
          <span style={{fontSize:'10px', color:'#4A6CF7', fontWeight:'700'}}>✏️ Personalizza</span>
        </div>
        {[
          {ico:'🚨', ibg:'linear-gradient(135deg,#F7295A,#FF8C42)', title:'Registra crisi ora', sub:'Timer in tempo reale'},
          {ico:'💊', ibg:'linear-gradient(135deg,#00BFA6,#4A6CF7)', title:'Terapie programmate', sub:'Prossima alle 20:00'},
          {ico:'🚽', ibg:'linear-gradient(135deg,#7B5EA7,#4A6CF7)', title:'Toilet Training', sub:'Log giornaliero'},
        ].map((r,i) => (
          <div key={i} style={{
            background:'#fff', borderRadius:'13px', padding:'10px 12px',
            display:'flex', alignItems:'center', gap:'10px',
            boxShadow:'0 3px 12px rgba(0,0,0,0.07)', marginBottom:'6px'
          }}>
            <div style={{
              width:'30px', height:'30px', borderRadius:'50%',
              background:r.ibg, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'13px', flexShrink:0,
              boxShadow:'0 3px 7px rgba(0,0,0,0.12)'
            }}>{r.ico}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'12px', fontWeight:'700', color:'#1A1F3A'}}>{r.title}</div>
              <div style={{fontSize:'9px', color:'#8A94B2'}}>{r.sub}</div>
            </div>
            <div style={{
              width:'18px', height:'18px', borderRadius:'50%',
              background:'#EEF3FD', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'10px', color:'#4A6CF7', fontWeight:'700'
            }}>›</div>
          </div>
        ))}
      </div>

      {/* TIMER */}
      <div style={{margin:'0 12px'}}>
        <div style={{
          background:'#fff', borderRadius:'18px', padding:'14px 12px',
          boxShadow:'0 6px 22px rgba(74,108,247,0.11)'
        }}>
          <div style={{fontSize:'13px', fontWeight:'800', color:'#1A1F3A', marginBottom:'8px'}}>
            ⏱ Registrazione crisi
          </div>
          <div style={{fontSize:'38px', fontWeight:'900', textAlign:'center', color:'#1A1F3A', letterSpacing:'-2px', fontVariantNumeric:'tabular-nums'}}>
            00:00:00
          </div>
          <div style={{textAlign:'center', fontSize:'10px', color:'#bbb', margin:'4px 0 12px'}}>
            Premi ▶ per avviare
          </div>
          <div style={{display:'flex', justifyContent:'center', gap:'12px'}}>
            <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#4A6CF7,#7B5EA7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#fff', cursor:'pointer', boxShadow:'0 4px 12px rgba(74,108,247,0.38)'}}>▶</div>
            <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#F7295A,#FF8C42)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#fff', cursor:'pointer', boxShadow:'0 4px 12px rgba(247,41,90,0.32)'}}>⏹</div>
            <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'#EEF3FD', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#8A94B2', cursor:'pointer'}}>↺</div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'#fff', borderTop:'1px solid #EDF0F8',
        display:'flex', padding:'6px 0 10px',
        boxShadow:'0 -3px 10px rgba(0,0,0,0.05)'
      }}>
        {[
          {ico:'🏠', label:'Home', act:true},
          {ico:'📋', label:'Diario'},
          {ico:'💊', label:'Terapie'},
          {ico:'🚽', label:'Toilet'},
          {ico:'📊', label:'Report'},
          {ico:'⚙️', label:'Altro'},
        ].map((n,i) => (
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px'}}>
            <div style={{
              width:'28px', height:'20px', display:'flex', alignItems:'center',
              justifyContent:'center', borderRadius:'7px', fontSize:'14px',
              background: n.act ? '#EEF3FD' : 'transparent'
            }}>{n.ico}</div>
            <div style={{
              fontSize:'8px', fontWeight: n.act ? '800' : '600',
              color: n.act ? '#4A6CF7' : '#bbb'
            }}>{n.label}</div>
          </div>
        ))}
      </div>

    </div>
  )
}