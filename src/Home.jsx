import { useState, useEffect } from 'react'
import { db } from './firebase'
import { ref, onValue } from 'firebase/database'

export default function Home() {
  const [crisi, setCrisi] = useState([])
  const [terapie, setTerapie] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carica crisi
    const crisiRef = ref(db, 'crises')
    const unsubCrisi = onValue(crisiRef, snap => {
      const val = snap.val()
      if (val) {
        const data = Object.values(val)
        setCrisi(data)
      } else {
        setCrisi([])
      }
      setLoading(false)
    })

    // Carica terapie
    const terapieRef = ref(db, 'terapies')
    const unsubTerapie = onValue(terapieRef, snap => {
      const val = snap.val()
      if (val) setTerapie(Object.values(val))
      else setTerapie([])
    })

    return () => {
      unsubCrisi()
      unsubTerapie()
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background:'#F0F2F8',
        fontFamily:"-apple-system,'Segoe UI',sans-serif"
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{
            width:'48px', height:'48px', borderRadius:'50%',
            border:'4px solid #EEF3FD', borderTop:'4px solid #4A6CF7',
            margin:'0 auto 16px', animation:'spin 0.8s linear infinite'
          }}/>
          <div style={{color:'#8A94B2', fontSize:'14px', fontWeight:'600'}}>
            Caricamento dati...
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#F0F2F8',
      fontFamily:"-apple-system,'Segoe UI',sans-serif",
      paddingBottom:'20px'
    }}>

      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg,#4A6CF7,#7B5EA7)',
        padding:'20px 16px 24px', textAlign:'center'
      }}>
        <div style={{fontSize:'22px', fontWeight:'900', color:'#fff'}}>
          DamiAPP
        </div>
        <div style={{fontSize:'13px', color:'rgba(255,255,255,0.75)', marginTop:'4px'}}>
          Ciao! 👋
        </div>
      </div>

      {/* Mini cards */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:'10px', padding:'16px', marginTop:'-12px'
      }}>

        {/* Ultima crisi */}
        <div style={{
          background:'#fff', borderRadius:'14px', overflow:'hidden',
          boxShadow:'0 3px 12px rgba(0,0,0,0.07)'
        }}>
          <div style={{padding:'10px 8px 6px'}}>
            <div style={{
              width:'28px', height:'28px', borderRadius:'8px',
              background:'linear-gradient(135deg,#F7295A,#FF9F3F)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', marginBottom:'6px'
            }}>❗</div>
            <div style={{fontSize:'8px', color:'#8A94B2', fontWeight:'700',
              textTransform:'uppercase', letterSpacing:'0.3px'}}>
              Ultima crisi
            </div>
            <div style={{fontSize:'18px', fontWeight:'900', color:'#1A1F3A'}}>
              {crisi.length > 0 ? `${crisi.length}` : '0'}
            </div>
            <div style={{fontSize:'8px', color:'#bbb'}}>registrate</div>
          </div>
          <div style={{height:'4px', background:'linear-gradient(90deg,#F7295A,#FF8C42)'}}/>
        </div>

        {/* Terapie */}
        <div style={{
          background:'#fff', borderRadius:'14px', overflow:'hidden',
          boxShadow:'0 3px 12px rgba(0,0,0,0.07)'
        }}>
          <div style={{padding:'10px 8px 6px'}}>
            <div style={{
              width:'28px', height:'28px', borderRadius:'8px',
              background:'linear-gradient(135deg,#00BFA6,#4A6CF7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', marginBottom:'6px'
            }}>💊</div>
            <div style={{fontSize:'8px', color:'#8A94B2', fontWeight:'700',
              textTransform:'uppercase', letterSpacing:'0.3px'}}>
              Terapie
            </div>
            <div style={{fontSize:'18px', fontWeight:'900', color:'#1A1F3A'}}>
              {terapie.length}
            </div>
            <div style={{fontSize:'8px', color:'#bbb'}}>attive</div>
          </div>
          <div style={{height:'4px', background:'linear-gradient(90deg,#00BFA6,#4A6CF7)'}}/>
        </div>

        {/* Streak */}
        <div style={{
          background:'#fff', borderRadius:'14px', overflow:'hidden',
          boxShadow:'0 3px 12px rgba(0,0,0,0.07)'
        }}>
          <div style={{padding:'10px 8px 6px'}}>
            <div style={{
              width:'28px', height:'28px', borderRadius:'8px',
              background:'linear-gradient(135deg,#00BFA6,#00D4C8)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', marginBottom:'6px'
            }}>🔥</div>
            <div style={{fontSize:'8px', color:'#8A94B2', fontWeight:'700',
              textTransform:'uppercase', letterSpacing:'0.3px'}}>
              Streak
            </div>
            <div style={{fontSize:'18px', fontWeight:'900', color:'#00BFA6'}}>
              26g
            </div>
            <div style={{fontSize:'8px', color:'#bbb'}}>senza crisi</div>
          </div>
          <div style={{height:'4px', background:'linear-gradient(90deg,#00BFA6,#FFD93D)'}}/>
        </div>

      </div>

      {/* Sezione crisi recenti */}
      <div style={{padding:'0 16px'}}>
        <div style={{
          background:'#fff', borderRadius:'16px',
          padding:'14px', boxShadow:'0 6px 22px rgba(74,108,247,0.1)'
        }}>
          <div style={{
            fontSize:'13px', fontWeight:'800', color:'#1A1F3A', marginBottom:'12px'
          }}>
            ⚡ Crisi recenti
          </div>
          {crisi.length === 0 ? (
            <div style={{textAlign:'center', padding:'20px', color:'#8A94B2', fontSize:'13px'}}>
              Nessuna crisi registrata
            </div>
          ) : (
            crisi.slice(-3).reverse().map((c, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:'10px',
                padding:'8px 0', borderBottom:'1px solid #EDF0F8'
              }}>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'10px',
                  background:'linear-gradient(135deg,#F7295A,#FF8C42)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'14px', flexShrink:0
                }}>⚡</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'12px', fontWeight:'700', color:'#1A1F3A'}}>
                    {c.type || 'Crisi'}
                  </div>
                  <div style={{fontSize:'10px', color:'#8A94B2'}}>
                    {c.date || '—'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}