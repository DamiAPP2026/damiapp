import { useState, useEffect } from 'react'
import { ChevronLeft, Phone, MapPin, Clock, AlertTriangle } from 'lucide-react'

export default function SOSPage({ onBack }) {
  const [time, setTime] = useState(new Date())
  const [gps, setGps] = useState(null)
  const [gpsError, setGpsError] = useState('')
  const [gpsLoading, setGpsLoading] = useState(true)
  const [indirizzo, setIndirizzo] = useState('')

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS non disponibile su questo dispositivo')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setGps({ latitude, longitude, accuracy })
        setGpsLoading(false)
        // Reverse geocoding con OpenStreetMap (gratuito)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=it`
          )
          const data = await res.json()
          if (data && data.address) {
            const a = data.address
            const parts = [
              a.road && a.house_number ? `${a.road} ${a.house_number}` : a.road,
              a.city || a.town || a.village || a.municipality,
              a.postcode,
              a.country
            ].filter(Boolean)
            setIndirizzo(parts.join(', '))
          }
        } catch {
          setIndirizzo(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        }
      },
      (err) => {
        setGpsError('Impossibile ottenere la posizione. Verifica i permessi GPS.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const giorni = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
  const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
    'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
  const dataStr = `${giorni[time.getDay()]} ${time.getDate()} ${mesi[time.getMonth()]} ${time.getFullYear()}`
  const timeStr = time.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit', second:'2-digit'})

  const mapsUrl = gps
    ? `https://maps.google.com/?q=${gps.latitude},${gps.longitude}`
    : null

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#f3f4f7;}
        .sos-wrap{background:#f3f4f7;min-height:100vh;
          font-family:-apple-system,'Segoe UI',sans-serif;
          width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="sos-wrap">

        {/* HEADER */}
        <div style={{
          background:'linear-gradient(135deg,#e53935,#FF8C42)',
          padding:'14px 16px 24px'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
            <button onClick={onBack} style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}><ChevronLeft size={20} color="#fff"/></button>
            <div>
              <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>🆘 Soccorso</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.75)'}}>
                Informazioni di emergenza
              </div>
            </div>
          </div>

          {/* Pulsante 112 grande */}
          <button
            onClick={() => window.location.href = 'tel:112'}
            style={{
              width:'100%', padding:'18px', borderRadius:'20px', border:'none',
              background:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.2)'
            }}>
            <div style={{
              width:'48px', height:'48px', borderRadius:'50%',
              background:'linear-gradient(135deg,#e53935,#FF8C42)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(229,57,53,0.4)'
            }}>
              <Phone size={22} color="#fff" fill="#fff"/>
            </div>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:'22px', fontWeight:'900', color:'#e53935', letterSpacing:'-0.5px'}}>
                Chiama 112
              </div>
              <div style={{fontSize:'12px', color:'#7c8088'}}>
                Numero unico emergenze
              </div>
            </div>
          </button>
        </div>

        <div style={{padding:'12px'}}>

          {/* ORA E DATA */}
          <div style={{
            background:'#feffff', borderRadius:'18px', padding:'16px',
            marginBottom:'10px',
            boxShadow:'0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'10px',
                background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Clock size={18} color="#fff"/>
              </div>
              <span style={{fontSize:'13px', fontWeight:'800', color:'#02153f'}}>
                Ora e data attuale
              </span>
            </div>
            <div style={{
              fontSize:'38px', fontWeight:'900', color:'#02153f',
              letterSpacing:'-1px', fontVariantNumeric:'tabular-nums',
              marginBottom:'4px'
            }}>{timeStr}</div>
            <div style={{fontSize:'14px', color:'#7c8088', fontWeight:'600'}}>
              {dataStr}
            </div>
          </div>

          {/* POSIZIONE GPS */}
          <div style={{
            background:'#feffff', borderRadius:'18px', padding:'16px',
            marginBottom:'10px',
            boxShadow:'0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'10px',
                background:'linear-gradient(135deg,#00BFA6,#2e84e9)',
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <MapPin size={18} color="#fff"/>
              </div>
              <span style={{fontSize:'13px', fontWeight:'800', color:'#02153f'}}>
                Posizione attuale
              </span>
            </div>

            {gpsLoading && (
              <div style={{
                padding:'16px', textAlign:'center',
                color:'#7c8088', fontSize:'13px'
              }}>
                📡 Acquisizione GPS in corso...
              </div>
            )}

            {gpsError && (
              <div style={{
                padding:'12px', borderRadius:'12px',
                background:'#FEF0F4', border:'1.5px solid #F7295A33',
                fontSize:'13px', color:'#F7295A', fontWeight:'600'
              }}>
                ⚠️ {gpsError}
              </div>
            )}

            {gps && !gpsLoading && (
              <>
                <div style={{
                  fontSize:'15px', fontWeight:'700', color:'#02153f',
                  marginBottom:'6px', lineHeight:'1.4'
                }}>
                  📍 {indirizzo || 'Calcolo indirizzo...'}
                </div>
                <div style={{
                  fontSize:'11px', color:'#bec1cc', marginBottom:'12px',
                  fontVariantNumeric:'tabular-nums'
                }}>
                  Lat: {gps.latitude.toFixed(6)} · Lon: {gps.longitude.toFixed(6)}
                  {gps.accuracy && ` · ±${Math.round(gps.accuracy)}m`}
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                    display:'flex', alignItems:'center', justifyContent:'center',
                    gap:'8px', padding:'12px', borderRadius:'12px',
                    background:'linear-gradient(135deg,#193f9e,#2e84e9)',
                    color:'#fff', textDecoration:'none',
                    fontSize:'13px', fontWeight:'800',
                    boxShadow:'0 4px 14px rgba(25,63,158,0.35)'
                  }}>
                    <MapPin size={16} color="#fff"/>
                    Apri in Google Maps
                  </a>
                )}
              </>
            )}
          </div>

          {/* AVVISO */}
          <div style={{
            background:'#FFF9E6', borderRadius:'14px', padding:'14px',
            border:'1.5px solid #FFD93D44',
            display:'flex', gap:'10px', alignItems:'flex-start'
          }}>
            <AlertTriangle size={18} color="#FF8C42" style={{flexShrink:0, marginTop:'1px'}}/>
            <div style={{fontSize:'12px', color:'#8B6914', lineHeight:'1.6'}}>
              In caso di emergenza chiama sempre il <strong>112</strong>.
              Comunica l'indirizzo mostrato sopra all'operatore.
              DamiAPP non sostituisce i servizi di emergenza.
            </div>
          </div>

        </div>
      </div>
    </>
  )
}