import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, MessageCircle, Clock, CheckCheck, Check, AlertCircle, ChevronLeft } from 'lucide-react'
import { db } from './firebase'
import { ref, push, onValue, serverTimestamp, update } from 'firebase/database'
import { decrypt } from './crypto'

const f = (base) => `${Math.round(base * 1.15)}px`
const NAVBAR_H = 58

// ─── HELPERS DATA/ORA ────────────────────────────────────────
function formatOra(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
function formatDataCompleta(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const oggi = new Date()
  const ieri = new Date(); ieri.setDate(ieri.getDate() - 1)
  const hm = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const dataStr = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  if (d.toDateString() === oggi.toDateString()) return `Oggi · ${hm}`
  if (d.toDateString() === ieri.toDateString()) return `Ieri · ${hm}`
  return `${dataStr} · ${hm}`
}
function formatGiornoSep(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const oggi = new Date()
  const ieri = new Date(); ieri.setDate(ieri.getDate() - 1)
  if (d.toDateString() === oggi.toDateString())
    return `Oggi · ${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
  if (d.toDateString() === ieri.toDateString())
    return `Ieri · ${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatOraSep(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const oggi = new Date()
  const ieri = new Date(); ieri.setDate(ieri.getDate() - 1)
  if (d.toDateString() === oggi.toDateString()) return `Oggi · ${formatOra(ts)}`
  if (d.toDateString() === ieri.toDateString()) return `Ieri · ${formatOra(ts)}`
  return `${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} · ${formatOra(ts)}`
}

// ─── SINGOLA CHAT ─────────────────────────────────────────────
// tokenId: ID univoco del token medico — Firebase path: messages/{tokenId}/
function SingleChat({ tokenId, nomeMedico, nomeUtente, isDemo, onBack }) {
  const [messaggi, setMessaggi] = useState([])
  const [testo,    setTesto]    = useState('')
  const [inviando, setInviando] = useState(false)
  const [errore,   setErrore]   = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const chatPath = `messages/${tokenId}`

  useEffect(() => {
    if (isDemo) {
      setMessaggi([
        { id: '1', testo: 'Buongiorno! Come sta Damiano questa settimana?',                                                              da: 'medico',   mittente: nomeMedico, timestamp: Date.now() - 86400000 * 2,           letto: true  },
        { id: '2', testo: 'Ha avuto 2 crisi lunedì, durata circa 2 minuti ciascuna. Mercoledì nessun episodio.',                        da: 'famiglia', mittente: nomeUtente, timestamp: Date.now() - 86400000 * 2 + 3600000, letto: true  },
        { id: '3', testo: 'Grazie per l\'aggiornamento. Continuate con la terapia attuale. Se le crisi si ripetono sentitemi subito.',   da: 'medico',   mittente: nomeMedico, timestamp: Date.now() - 86400000,              letto: true  },
        { id: '4', testo: 'Perfetto, grazie dottore.',                                                                                  da: 'famiglia', mittente: nomeUtente, timestamp: Date.now() - 3600000 * 5,            letto: true  },
        { id: '5', testo: 'Ho rivisto i report delle ultime settimane. Il pattern delle crisi sembra concentrarsi al mattino.',          da: 'medico',   mittente: nomeMedico, timestamp: Date.now() - 1800000,               letto: false },
      ])
      return
    }
    const unsub = onValue(ref(db, chatPath), snap => {
      const val = snap.val()
      if (!val) { setMessaggi([]); return }
      const lista = Object.entries(val)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      setMessaggi(lista)
      // Marca come letti i messaggi del medico
      lista
        .filter(m => m.da === 'medico' && !m.letto)
        .forEach(m => update(ref(db, `${chatPath}/${m.id}`), { letto: true }))
    })
    return () => unsub()
  }, [tokenId, isDemo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messaggi])

  async function invia() {
    const txt = testo.trim()
    if (!txt || inviando) return
    setInviando(true); setErrore('')
    try {
      if (isDemo) {
        setMessaggi(prev => [...prev, {
          id: Date.now().toString(), testo: txt,
          da: 'famiglia', mittente: nomeUtente,
          timestamp: Date.now(), letto: false
        }])
        setTesto(''); setInviando(false); return
      }
      await push(ref(db, chatPath), {
        testo: txt, da: 'famiglia', mittente: nomeUtente,
        timestamp: serverTimestamp(), letto: false
      })
      setTesto('')
    } catch (err) {
      console.error(err); setErrore('Errore nell\'invio. Riprova.')
    }
    setInviando(false)
  }

  // Raggruppa per giorno
  const gruppi = []
  messaggi.forEach((m, i) => {
    const giorno = new Date(m.timestamp || 0).toDateString()
    if (i === 0 || giorno !== new Date(messaggi[i - 1].timestamp || 0).toDateString())
      gruppi.push({ tipo: 'separatore', giorno: formatGiornoSep(m.timestamp) })
    gruppi.push({ tipo: 'msg', ...m })
  })

  const nonLetti = messaggi.filter(m => m.da === 'medico' && !m.letto).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100dvh - ${NAVBAR_H}px)`, background: '#f3f4f7', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#193f9e,#2e84e9)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: '0 4px 20px rgba(25,63,158,0.25)' }}>
        <button type="button" onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#fff" />
        </button>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={20} color="#fff" />
          </div>
          {nonLetti > 0 && (
            <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '16px', height: '16px', borderRadius: '50%', background: '#F7295A', border: '2px solid #193f9e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{nonLetti > 9 ? '9+' : nonLetti}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: f(15), fontWeight: '900', color: '#fff' }}>{nomeMedico}</div>
          <div style={{ fontSize: f(10), color: 'rgba(255,255,255,0.7)' }}>
            {nonLetti > 0 ? `${nonLetti} non letti` : 'Chat privata'}
          </div>
        </div>
        {isDemo && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: f(9), color: '#fff', fontWeight: '700' }}>DEMO</span>}
      </div>

      {/* MESSAGGI */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {gruppi.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#193f9e22,#2e84e922)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MessageCircle size={28} color="#2e84e9" />
            </div>
            <div style={{ fontSize: f(15), fontWeight: '800', color: '#02153f', marginBottom: '6px' }}>Nessun messaggio</div>
            <div style={{ fontSize: f(12), color: '#7c8088', lineHeight: '1.6', maxWidth: '240px' }}>
              Scrivi un messaggio. Il medico risponderà appena possibile.
            </div>
          </div>
        )}

        {gruppi.map((item, i) => {
          if (item.tipo === 'separatore') return (
            <div key={`sep-${i}`} style={{ textAlign: 'center', margin: '10px 0 5px' }}>
              <span style={{ background: '#e8eaf0', borderRadius: '20px', padding: '3px 12px', fontSize: f(9), color: '#7c8088', fontWeight: '600', textTransform: 'capitalize' }}>{item.giorno}</span>
            </div>
          )
          const isMio = item.da === 'famiglia'
          const nonLetto = !isMio && !item.letto
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: isMio ? 'flex-end' : 'flex-start', marginBottom: '2px' }}>
              <div style={{
                maxWidth: '78%',
                background: isMio ? 'linear-gradient(135deg,#193f9e,#2e84e9)' : '#feffff',
                borderRadius: isMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '10px 13px',
                boxShadow: isMio ? '0 4px 14px rgba(25,63,158,0.30)' : '0 2px 10px rgba(2,21,63,0.08)',
                border: nonLetto ? '2px solid #2e84e933' : 'none',
              }}>
                {!isMio && (
                  <div style={{ fontSize: f(9), fontWeight: '800', color: '#2e84e9', marginBottom: '3px' }}>
                    {item.mittente || 'Medico'}
                    {nonLetto && <span style={{ marginLeft: '5px', background: '#2e84e9', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '8px', fontWeight: '800' }}>nuovo</span>}
                  </div>
                )}
                <div style={{ fontSize: f(13), lineHeight: '1.5', color: isMio ? '#fff' : '#02153f', wordBreak: 'break-word' }}>{item.testo}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '5px' }}>
                  <span style={{ fontSize: f(8), color: isMio ? 'rgba(255,255,255,0.65)' : '#bec1cc' }}>{formatDataCompleta(item.timestamp)}</span>
                  {isMio && (item.letto
                    ? <CheckCheck size={11} color="rgba(255,255,255,0.8)" />
                    : <Check size={11} color="rgba(255,255,255,0.5)" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} style={{ height: '8px' }} />
      </div>

      {/* ERRORE */}
      {errore && (
        <div style={{ margin: '8px 12px 0', padding: '8px 12px', borderRadius: '10px', background: '#FEF0F4', border: '1px solid #F7295A22', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} color="#F7295A" />
          <span style={{ fontSize: f(11), color: '#F7295A', fontWeight: '600' }}>{errore}</span>
        </div>
      )}

      {/* DISCLAIMER */}
      <div style={{ background: '#FFF5EE', borderTop: '1px solid #FF8C4222', padding: '7px 14px', display: 'flex', alignItems: 'flex-start', gap: '7px', flexShrink: 0 }}>
        <AlertCircle size={13} color="#FF8C42" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: f(9), color: '#8B6914', lineHeight: '1.6' }}>
          I messaggi sono <strong>permanenti, non eliminabili e non recuperabili</strong> se persi. La chat non sostituisce una visita medica.
        </div>
      </div>

      {/* INPUT */}
      <div style={{ padding: '10px 12px 14px', background: '#feffff', borderTop: '1px solid #f0f1f4', boxShadow: '0 -4px 16px rgba(2,21,63,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={testo}
            onChange={e => setTesto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); invia() } }}
            placeholder="Scrivi un messaggio…"
            rows={1}
            style={{ flex: 1, padding: '11px 14px', borderRadius: '22px', border: '2px solid #e8eaf0', fontSize: f(13), fontFamily: 'inherit', resize: 'none', outline: 'none', background: '#f3f4f7', color: '#02153f', lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#2e84e9'}
            onBlur={e => e.target.style.borderColor = '#e8eaf0'}
          />
          <button type="button" onClick={invia} disabled={!testo.trim() || inviando} style={{
            width: '44px', height: '44px', borderRadius: '50%', border: 'none',
            background: testo.trim() && !inviando ? 'linear-gradient(135deg,#193f9e,#2e84e9)' : '#e8eaf0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: testo.trim() && !inviando ? 'pointer' : 'default',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: testo.trim() && !inviando ? '0 4px 14px rgba(25,63,158,0.35)' : 'none',
          }}>
            {inviando ? <Clock size={18} color="#bec1cc" /> : <Send size={18} color={testo.trim() ? '#fff' : '#bec1cc'} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── LISTA CONVERSAZIONI ──────────────────────────────────────
// Mostra tutte le chat attive con badge non letti per ognuna.
// tokens: array di { tokenId, nomeMedico } caricato da Firebase (nodo 'tokens')
function ListaChat({ tokens, isDemo, nomeUtente, onSelect }) {
  // Per ogni token ascolta il suo nodo messages/{tokenId}
  // e conta i messaggi non letti da 'medico'
  const [nonLettiMap, setNonLettiMap] = useState({}) // { [tokenId]: { count, ultimoMsg, ultimoTs } }

  useEffect(() => {
    if (isDemo) {
      setNonLettiMap({
        'demo-token-1': { count: 2, ultimoMsg: 'Il pattern delle crisi sembra concentrarsi al mattino.', ultimoTs: Date.now() - 1800000 },
        'demo-token-2': { count: 0, ultimoMsg: 'Grazie per le informazioni.', ultimoTs: Date.now() - 86400000 },
      })
      return
    }
    const unsubs = tokens.map(({ tokenId }) => {
      return onValue(ref(db, `messages/${tokenId}`), snap => {
        const val = snap.val()
        if (!val) {
          setNonLettiMap(prev => ({ ...prev, [tokenId]: { count: 0, ultimoMsg: null, ultimoTs: null } }))
          return
        }
        const lista = Object.values(val).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        const nonLetti = lista.filter(m => m.da === 'medico' && !m.letto).length
        const ultimo = lista[lista.length - 1]
        setNonLettiMap(prev => ({
          ...prev,
          [tokenId]: { count: nonLetti, ultimoMsg: ultimo?.testo || null, ultimoTs: ultimo?.timestamp || null }
        }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [tokens, isDemo])

  const totaleNonLetti = Object.values(nonLettiMap).reduce((s, v) => s + (v.count || 0), 0)

  const tokensDaMonstrare = isDemo
    ? [
        { tokenId: 'demo-token-1', nomeMedico: 'Dr. Bianchi' },
        { tokenId: 'demo-token-2', nomeMedico: 'Dr. Rossi' },
      ]
    : tokens

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100dvh - ${NAVBAR_H}px)`, background: '#f3f4f7', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#193f9e,#2e84e9)', padding: '18px 16px 20px', flexShrink: 0, boxShadow: '0 4px 20px rgba(25,63,158,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={22} color="#fff" />
            </div>
            {totaleNonLetti > 0 && (
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#F7295A', border: '2px solid #193f9e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{totaleNonLetti > 99 ? '99+' : totaleNonLetti}</span>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: f(17), fontWeight: '900', color: '#fff' }}>Messaggi</div>
            <div style={{ fontSize: f(10), color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>
              {totaleNonLetti > 0 ? `${totaleNonLetti} non letti` : `${tokensDaMonstrare.length} conversazioni`}
            </div>
          </div>
          {isDemo && <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: f(9), color: '#fff', fontWeight: '700' }}>DEMO</span>}
        </div>
      </div>

      {/* LISTA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {tokensDaMonstrare.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MessageCircle size={28} color="#2e84e9" />
            </div>
            <div style={{ fontSize: f(15), fontWeight: '800', color: '#02153f', marginBottom: '6px' }}>Nessuna chat attiva</div>
            <div style={{ fontSize: f(12), color: '#7c8088', lineHeight: '1.6', maxWidth: '240px' }}>
              Le conversazioni appaiono quando condividi l'accesso con un medico e abiliti la chat.
            </div>
          </div>
        ) : (
          tokensDaMonstrare.map(({ tokenId, nomeMedico }) => {
            const info = nonLettiMap[tokenId] || {}
            const hasNew = info.count > 0
            return (
              <button
                key={tokenId}
                type="button"
                onClick={() => onSelect({ tokenId, nomeMedico })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  background: hasNew ? '#feffff' : '#feffff',
                  marginBottom: '8px', textAlign: 'left', fontFamily: 'inherit',
                  boxShadow: hasNew
                    ? '0 4px 18px rgba(25,63,158,0.14), 0 0 0 2px #2e84e933'
                    : '0 2px 10px rgba(2,21,63,0.07)',
                  transition: 'all 0.18s',
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: hasNew ? 'linear-gradient(135deg,#193f9e,#2e84e9)' : 'linear-gradient(135deg,#dde0ed,#bec1cc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: '800', color: '#fff',
                  }}>
                    {nomeMedico.replace('Dr. ', '').charAt(0).toUpperCase()}
                  </div>
                  {hasNew && (
                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '16px', height: '16px', borderRadius: '50%', background: '#F7295A', border: '2px solid #feffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{info.count > 9 ? '9+' : info.count}</span>
                    </div>
                  )}
                </div>

                {/* Testo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: f(14), fontWeight: hasNew ? '800' : '700', color: '#02153f' }}>{nomeMedico}</span>
                    {info.ultimoTs && (
                      <span style={{ fontSize: f(9), color: hasNew ? '#F7295A' : '#bec1cc', fontWeight: hasNew ? '700' : '500', flexShrink: 0, marginLeft: '8px' }}>
                        {formatOraSep(info.ultimoTs)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: f(12), color: hasNew ? '#394058' : '#bec1cc', fontWeight: hasNew ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {info.ultimoMsg || 'Nessun messaggio ancora'}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── EXPORT PRINCIPALE ────────────────────────────────────────
// tokens: array di { tokenId, nomeMedico } con chat abilitata
// Se tokens non viene passato (vecchio comportamento), carica i token da Firebase
export default function MessaggiPage({ onBack, isDemo, nomeUtente = 'Famiglia', tokens = null }) {
  const [chatSelezionata, setChatSelezionata] = useState(null) // { tokenId, nomeMedico }
  const [tokenList,       setTokenList]       = useState([])

  useEffect(() => {
    // Se tokens è passato dall'esterno (da App.jsx che conosce i token attivi con chat abilitata)
    if (tokens !== null) {
      setTokenList(tokens)
      return
    }
    if (isDemo) return
    // Altrimenti carica da Firebase il nodo 'sharetokens' e filtra quelli con shareChat=true
    const unsub = onValue(ref(db, 'sharetokens'), snap => {
      const val = snap.val()
      if (!val) { setTokenList([]); return }
      const lista = Object.entries(val)
        .map(([_fbKey, enc]) => {
          // I token sono cifrati con encrypt() — decifra se necessario
          const t = typeof enc === 'object' ? enc : decrypt(enc)
          return t || null
        })
        .filter(Boolean)
        // t.token è la stringa univoca (es. "DMIABC12345") — è il path Firebase messages/{t.token}
        .filter(t => t.active && t.token && t.permissions?.shareChat)
        .map(t => ({
          tokenId:    t.token,   // <-- la stringa univoca generata da generateToken()
          nomeMedico: t.medicoName ? `Dr. ${t.medicoName}` : (t.intestatario || 'Medico'),
        }))
      setTokenList(lista)
    })
    return () => unsub()
  }, [tokens, isDemo])

  // Vista singola chat
  if (chatSelezionata) {
    return (
      <SingleChat
        tokenId={chatSelezionata.tokenId}
        nomeMedico={chatSelezionata.nomeMedico}
        nomeUtente={nomeUtente}
        isDemo={isDemo}
        onBack={() => setChatSelezionata(null)}
      />
    )
  }

  // Lista conversazioni
  return (
    <ListaChat
      tokens={tokenList}
      isDemo={isDemo}
      nomeUtente={nomeUtente}
      onSelect={setChatSelezionata}
    />
  )
}
