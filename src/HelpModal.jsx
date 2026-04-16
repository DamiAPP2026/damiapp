import { useState } from 'react'
import {
  X, ChevronDown, ChevronUp,
  Brain, Droplets, BarChart2, MessageCircle,
  FileText, Package, Pill, Save, Eye,
  CalendarDays, Clock, Activity, TrendingUp,
  Timer, Zap, Heart, CheckCircle2, AlertTriangle,
  HelpCircle
} from 'lucide-react'

const f = (base) => `${Math.round(base * 1.15)}px`

// ─── CONTENUTI HELP ──────────────────────────────────────────

const SEZIONI_MEDICO = (perms = {}) => [
  {
    key: 'crisi',
    show: true, // sempre visibile: è il modulo base
    Icon: Brain,
    color: '#F7295A',
    bg: '#FEF0F4',
    titolo: 'Crisi epilettiche',
    intro: 'Vedi tutte le crisi registrate dalla famiglia, con tipo, durata, intensità e trigger.',
    voci: [
      { label: 'Tipo di crisi', desc: 'La classificazione medica: tonico-cloniche, assenza, miocloniche, ecc. Ogni tipo ha un colore diverso per riconoscerlo a colpo d\'occhio.' },
      { label: 'Durata', desc: 'Quanto è durata la crisi in minuti e secondi. Registrata automaticamente con il timer.' },
      { label: 'Intensità (1-10)', desc: 'Valutazione soggettiva della famiglia da 1 (lieve) a 10 (molto severa). Utile per seguire l\'andamento nel tempo.' },
      { label: 'Perdita di coscienza', desc: 'Indica se durante la crisi il paziente ha perso conoscenza. Rilevante per la valutazione clinica.' },
      { label: 'Trigger', desc: 'La causa scatenante registrata dalla famiglia: mancanza di sonno, stress, febbre, ecc.' },
    ],
  },
  {
    key: 'terapie',
    show: !!perms.shareTerapie,
    Icon: Pill,
    color: '#00BFA6',
    bg: '#E8FBF8',
    titolo: 'Terapie',
    intro: 'Elenco dei farmaci programmati con orario e dosaggio.',
    voci: [
      { label: 'Nome farmaco', desc: 'Il nome del medicinale così come è stato inserito dalla famiglia.' },
      { label: 'Orario', desc: 'A che ora va somministrato. Le terapie già passate appaiono barrate.' },
      { label: 'Quantità / note', desc: 'Il dosaggio e eventuali annotazioni (es. "da somministrare a stomaco pieno").' },
    ],
  },
  {
    key: 'toilet',
    show: !!perms.shareToilet,
    Icon: Droplets,
    color: '#7B5EA7',
    bg: '#F5F3FF',
    titolo: 'Toilet Training',
    intro: 'Registro delle sessioni di training, con modalità e incidenti.',
    voci: [
      { label: 'Bisogno', desc: 'Cosa ha fatto in bagno: pipì, cacca o entrambi.' },
      { label: 'Modalità', desc: 'Come è avvenuta la sessione: 👆 Comando adulto (l\'adulto ha deciso lui), 🤝 CAA guidata (comunicazione assistita), ⭐ CAA autonoma (il bambino ha comunicato da solo — il risultato migliore).' },
      { label: 'Incidente', desc: 'Se c\'è stato un incidente prima o indipendentemente dalla sessione in bagno.' },
    ],
  },
  {
    key: 'documenti',
    show: !!perms.shareDocuments,
    Icon: FileText,
    color: '#2e84e9',
    bg: '#EEF3FD',
    titolo: 'Documenti condivisi',
    intro: 'I documenti medici che la famiglia ha scelto di condividere con te.',
    voci: [
      { label: 'Tipo documento', desc: 'Referto, certificato, esame, ecc.' },
      { label: 'Bottone Apri', desc: 'Apre il documento direttamente nel browser. Se è un\'immagine la puoi vedere, se è un PDF puoi scaricarlo.' },
    ],
  },
  {
    key: 'magazzino',
    show: !!perms.shareMagazzino,
    Icon: Package,
    color: '#FF8C42',
    bg: '#FFF5EE',
    titolo: 'Scorte medicinali',
    intro: 'Elenco delle scorte di farmaci con data di scadenza.',
    voci: [
      { label: 'Scadenza', desc: 'La data di scadenza della confezione. Appare in rosso se scade entro 30 giorni — segnalo alla famiglia.' },
      { label: 'Numero scatole', desc: 'Quante confezioni restano. Utile per pianificare le prescrizioni.' },
    ],
  },
  {
    key: 'chat',
    show: !!perms.shareChat,
    Icon: MessageCircle,
    color: '#7B5EA7',
    bg: '#F5F3FF',
    titolo: 'Messaggi con la famiglia',
    intro: 'Chat diretta con la famiglia del paziente.',
    voci: [
      { label: 'Spunta singola ✓', desc: 'Il messaggio è stato inviato ma non ancora letto dalla famiglia.' },
      { label: 'Spunta doppia ✓✓', desc: 'Il messaggio è stato letto dalla famiglia.' },
      { label: 'Attenzione', desc: 'I messaggi sono permanenti e non eliminabili. Questa chat non sostituisce una visita medica.' },
    ],
  },
  {
    key: 'report',
    show: true,
    Icon: BarChart2,
    color: '#193f9e',
    bg: '#EEF3FD',
    titolo: 'Report e grafici',
    intro: 'Analisi statistica completa con grafici interattivi. Seleziona il periodo in alto (7g, 30g, 3M, 6M, 1A, Tutto) per filtrare tutti i dati.',
    isReport: true,
    grafici: {
      crisi: [
        {
          Icon: CalendarDays,
          color: '#193f9e',
          nome: 'Calendario crisi',
          come: 'Ogni giorno del mese è una cella. Il colore indica quante crisi ci sono state: bianco = zero, rosa chiaro = 1, rosa = 2-3, rosso intenso = 4+. Il numero grande dentro la cella indica il conteggio. Il bordo blu indica il giorno di oggi.',
          leggere: 'Cerca cluster di celle rosse: giorni ravvicinati con molte crisi possono indicare un periodo di scompenso. Mesi interi bianchi sono ottimi segnali di controllo.',
        },
        {
          Icon: Clock,
          color: '#7B5EA7',
          nome: 'Fasce orarie',
          come: 'Le 24 ore sono divise in 6 blocchi da 4 ore (Notte 0-4, Alba 4-8, Mattina 8-12, Pomeriggio 12-16, Sera 16-20, Notte 20-24). Ogni barra mostra quante crisi sono avvenute in quella fascia. Il rosso indica la fascia più a rischio.',
          leggere: 'Una fascia dominante può suggerire un pattern circadiano utile per modulare la terapia (es. dose serale maggiore se le crisi avvengono di notte).',
        },
        {
          Icon: Activity,
          color: '#FF8C42',
          nome: 'Pattern circadiano ora per ora',
          come: 'Una riga di 24 celle, una per ogni ora (0-23). Più scuro il colore, più crisi in quell\'ora. Il numero nella cella indica il conteggio.',
          leggere: 'Versione più granulare delle fasce orarie. Utile per identificare picchi precisi (es. "crisi alle 7 di mattina al risveglio").',
        },
        {
          Icon: TrendingUp,
          color: '#2e84e9',
          nome: 'Tendenza e confronto anno precedente',
          come: 'Grafico a linee settimana per settimana. La linea blu piena = anno in corso. La linea grigia tratteggiata = stesso periodo dell\'anno scorso. L\'area colorata aiuta a vedere la tendenza. In alto a destra compare il delta (+/- rispetto all\'anno precedente).',
          leggere: 'Se la linea blu è sotto quella grigia: miglioramento rispetto all\'anno scorso. Picchi improvvisi nella linea blu possono corrispondere a eventi (febbre, cambi di terapia).',
        },
        {
          Icon: Timer,
          color: '#00BFA6',
          nome: 'Durata media per tipo di crisi',
          come: 'Barre orizzontali, una per ogni tipo di crisi. La lunghezza della barra = durata media in minuti/secondi. Il badge colorato a destra = numero di episodi nel periodo selezionato.',
          leggere: 'Le crisi tonico-cloniche sono generalmente le più lunghe. Se la durata media aumenta nel tempo per lo stesso tipo, può essere un segnale da monitorare.',
        },
        {
          Icon: AlertTriangle,
          color: '#00BFA6',
          nome: 'Intervallo libero da crisi',
          come: 'Una barra di avanzamento verso un obiettivo clinico di 30 giorni. Verde = buon controllo (14+ giorni), arancione = attenzione (7-14 giorni), rosso = crisi recente. Sotto compare anche il record storico di giorni senza crisi.',
          leggere: 'Indicatore immediato dello stato di controllo. L\'obiettivo dei 30 giorni è indicativo: discuti con la famiglia quale soglia è rilevante per il paziente.',
        },
        {
          Icon: Zap,
          color: '#FF8C42',
          nome: 'Trigger più frequenti',
          come: 'Barre orizzontali con percentuale. Ogni barra è un trigger registrato dalla famiglia (mancanza sonno, stress, febbre...). La lunghezza indica quante crisi nel periodo avevano quel trigger.',
          leggere: 'I trigger con percentuale alta sono priorità di intervento. "Mancanza sonno" frequente può suggerire di rivedere la routine o la terapia serale.',
        },
        {
          Icon: BarChart2,
          color: '#F7295A',
          nome: 'Distribuzione per tipo',
          come: 'Barre con percentuale per ogni tipo di crisi nel periodo. Punto colorato a sinistra = colore identificativo del tipo.',
          leggere: 'Se un tipo aumenta la sua percentuale nel tempo (confrontando periodi diversi), può indicare un cambiamento nel pattern epilettico.',
        },
        {
          Icon: Heart,
          color: '#7B5EA7',
          nome: 'Perdita di coscienza',
          come: 'Due riquadri: crisi con perdita di coscienza (rosso) e senza (verde). La barra in basso mostra la proporzione percentuale.',
          leggere: 'Un\'alta percentuale di crisi con perdita di coscienza indica un impatto maggiore sulla qualità di vita e richiede più attenzione alla sicurezza.',
        },
      ],
      toilet: [
        {
          Icon: CheckCircle2,
          color: '#00BFA6',
          nome: 'Percentuale sessioni riuscite',
          come: 'Tre riquadri con percentuale: Riuscite (verde), Incidenti pipì (arancione), Incidenti cacca (rosso). La barra composita sotto mostra visivamente la proporzione.',
          leggere: 'L\'obiettivo del toilet training è aumentare la percentuale verde nel tempo. Una % di riuscite in crescita indica progressi nel programma ABA.',
        },
        {
          Icon: BarChart2,
          color: '#7B5EA7',
          nome: 'Sessioni vs incidenti per settimana',
          come: 'Barre doppie per ogni settimana. Viola = sessioni totali in bagno. Arancione = incidenti (pipì + cacca). Le settimane sono etichettate S1, S2, ecc.',
          leggere: 'Cerca settimane con barre viola alte e arancioni basse: significa molte sessioni riuscite e pochi incidenti. Un trend di incidenti in calo è il segnale di progresso.',
        },
        {
          Icon: Clock,
          color: '#7B5EA7',
          nome: 'Pattern orario sessioni toilet',
          come: 'Riga di 24 celle ora per ora (come il circadiano crisi ma per le sessioni toilet). Viola scuro = ore con più sessioni.',
          leggere: 'Mostra a che ora del giorno vengono effettuate le sessioni. Utile per valutare se il programma di accompagnamento ogni 45-90 minuti viene rispettato.',
        },
        {
          Icon: TrendingUp,
          color: '#7B5EA7',
          nome: 'Trend incidenti — confronto anno',
          come: 'Linea viola = incidenti anno corrente settimana per settimana. Linea grigia tratteggiata = stesso periodo anno scorso. Delta in alto a destra.',
          leggere: 'Se la linea viola è sotto quella grigia: meno incidenti rispetto all\'anno scorso, il programma funziona. Picchi improvvisi possono corrispondere a cambi di ambiente o educatori.',
        },
      ],
    },
  },
]

const SEZIONI_TOILET_WRITER = [
  {
    key: 'come_usare',
    Icon: Save,
    color: '#7B5EA7',
    bg: '#F5F3FF',
    titolo: 'Come registrare una sessione',
    intro: 'Il tuo compito è registrare ogni sessione di toilet training o incidente. Ecco come funziona ogni campo.',
    voci: [
      { label: '📅 Data e ora', desc: 'Vengono precompilate automaticamente con l\'orario attuale. Modificale se stai registrando una sessione avvenuta poco fa.' },
      { label: '⚠️ Incidente addosso', desc: 'Attiva questo toggle se il bambino ha avuto un incidente (pipì o cacca addosso) — anche se poi è andato in bagno. I due toggle sono indipendenti.' },
      { label: '🚽 Ha usato il bagno?', desc: 'Seleziona cosa ha fatto: Pipì, Cacca o Entrambi. Se non ha usato il bagno lascia vuoto.' },
      { label: '👆 Modalità', desc: 'Dopo aver selezionato cosa ha fatto, scegli come è avvenuto: Comando adulto (sei stato tu a portarlo), CAA guidata (ha usato la comunicazione assistita con supporto), CAA autonoma (ha comunicato da solo — segnalo sempre, è un successo!).' },
      { label: '📝 Note', desc: 'Opzionale. Scrivi qualsiasi osservazione utile: umore del bambino, contesto, comportamento particolare.' },
      { label: '💾 Salva sessione', desc: 'Il dato viene salvato direttamente nell\'app della famiglia e nel registro condiviso. Appare subito nella sezione Report.' },
    ],
  },
  {
    key: 'modalita',
    Icon: Droplets,
    color: '#7B5EA7',
    bg: '#F5F3FF',
    titolo: 'Le tre modalità CAA — cosa significano',
    intro: 'La modalità è il dato più importante del toilet training ABA. Indica il livello di autonomia raggiunto.',
    voci: [
      { label: '👆 Comando adulto', desc: 'Sei stato tu a decidere di portarlo in bagno, senza un suo segnale. Va registrato ugualmente: aiuta a capire la frequenza degli accompagnamenti.' },
      { label: '🤝 CAA guidata', desc: 'Il bambino ha usato la comunicazione (pittogrammi, tabella CAA) ma con il tuo supporto fisico o verbale. È un passo intermedio importante.' },
      { label: '⭐ CAA autonoma', desc: 'Il bambino ha comunicato il bisogno da solo, senza essere sollecitato. È l\'obiettivo finale del programma — segna sempre questo risultato con cura, viene evidenziato nei grafici.' },
    ],
  },
]

const SEZIONI_VIEWER = [
  {
    key: 'cosa_vedi',
    Icon: Eye,
    color: '#00BFA6',
    bg: '#E8FBF8',
    titolo: 'Cosa puoi vedere',
    intro: 'Hai accesso in sola lettura a un riepilogo dello stato del paziente. Non puoi modificare nulla.',
    voci: [
      { label: 'Crisi ultima settimana', desc: 'Quante crisi ci sono state negli ultimi 7 giorni, con tipo, durata e intensità. Se il numero è 0 tutto è sotto controllo.' },
      { label: 'Terapie di oggi', desc: 'I farmaci programmati per oggi. Quelli già passati appaiono barrati: la famiglia li ha già somministrati o è l\'orario già trascorso.' },
      { label: 'Toilet training', desc: 'Grafici riassuntivi delle sessioni di training. Aiutano a capire l\'andamento generale del programma.' },
    ],
  },
  {
    key: 'grafici_viewer',
    Icon: BarChart2,
    color: '#00BFA6',
    bg: '#E8FBF8',
    titolo: 'Come leggere i grafici toilet',
    intro: 'I grafici che vedi mostrano l\'andamento delle sessioni di bagno e degli incidenti.',
    voci: [
      { label: 'Barre viola', desc: 'Sessioni totali in bagno per settimana. Più alta la barra, più sessioni sono state effettuate.' },
      { label: 'Barre arancioni', desc: 'Incidenti (pipì o cacca addosso) per settimana. L\'obiettivo è che queste barre diminuiscano nel tempo.' },
      { label: 'Pattern orario', desc: 'Mostra a che ora del giorno avvengono più sessioni. Aiuta a capire se il ritmo di accompagnamento viene rispettato.' },
    ],
  },
]

// ─── CARD ESPANDIBILE ────────────────────────────────────────
function HelpCard({ sezione, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const { Icon, color, bg, titolo, intro, voci, isReport, grafici } = sezione

  return (
    <div style={{
      background: '#feffff',
      borderRadius: '16px',
      marginBottom: '10px',
      boxShadow: '0 4px 16px rgba(2,21,63,0.08)',
      overflow: 'hidden',
      border: `1.5px solid ${open ? color + '44' : '#f0f1f4'}`,
      transition: 'border-color 0.2s',
    }}>
      {/* Header card */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: f(13), fontWeight: '800', color: '#02153f' }}>{titolo}</div>
          <div style={{ fontSize: f(10), color: '#7c8088', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{intro}</div>
        </div>
        {open
          ? <ChevronUp size={18} color="#bec1cc" style={{ flexShrink: 0 }} />
          : <ChevronDown size={18} color="#bec1cc" style={{ flexShrink: 0 }} />
        }
      </button>

      {/* Contenuto espanso */}
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ height: '1px', background: '#f0f1f4', marginBottom: '14px' }} />

          {/* Intro */}
          <div style={{
            fontSize: f(12), color: '#394058', lineHeight: '1.6',
            padding: '10px 12px', background: bg,
            borderRadius: '10px', marginBottom: '14px',
            borderLeft: `3px solid ${color}`,
          }}>
            {intro}
          </div>

          {/* Voci */}
          {voci && voci.map((v, i) => (
            <div key={i} style={{
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: i < voci.length - 1 ? '1px solid #f3f4f7' : 'none',
            }}>
              <div style={{ fontSize: f(12), fontWeight: '800', color, marginBottom: '4px' }}>{v.label}</div>
              <div style={{ fontSize: f(11), color: '#7c8088', lineHeight: '1.6' }}>{v.desc}</div>
            </div>
          ))}

          {/* Sezione grafici Report */}
          {isReport && grafici && (
            <>
              {/* TAB CRISI */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#FEF0F4', borderRadius: '10px',
                padding: '8px 12px', marginBottom: '10px', marginTop: '4px',
              }}>
                <Brain size={14} color="#F7295A" />
                <span style={{ fontSize: f(12), fontWeight: '800', color: '#F7295A' }}>Tab Crisi — grafici</span>
              </div>
              {grafici.crisi.map((g, i) => (
                <GraficoCard key={i} grafico={g} />
              ))}

              {/* TAB TOILET */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#F5F3FF', borderRadius: '10px',
                padding: '8px 12px', marginBottom: '10px', marginTop: '6px',
              }}>
                <Droplets size={14} color="#7B5EA7" />
                <span style={{ fontSize: f(12), fontWeight: '800', color: '#7B5EA7' }}>Tab Toilet Training — grafici</span>
              </div>
              {grafici.toilet.map((g, i) => (
                <GraficoCard key={i} grafico={g} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CARD SINGOLO GRAFICO ────────────────────────────────────
function GraficoCard({ grafico }) {
  const [open, setOpen] = useState(false)
  const { Icon, color, nome, come, leggere } = grafico

  return (
    <div style={{
      background: '#f8f9ff',
      borderRadius: '12px',
      marginBottom: '8px',
      border: `1px solid ${open ? color + '44' : '#eef0f5'}`,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 13px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <Icon size={15} color={color} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: f(12), fontWeight: '700', color: '#02153f' }}>{nome}</span>
        {open
          ? <ChevronUp size={15} color="#bec1cc" style={{ flexShrink: 0 }} />
          : <ChevronDown size={15} color="#bec1cc" style={{ flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ padding: '0 13px 13px' }}>
          <div style={{ height: '1px', background: '#eef0f5', marginBottom: '10px' }} />

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: f(10), fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
              Come è fatto
            </div>
            <div style={{ fontSize: f(11), color: '#394058', lineHeight: '1.65' }}>{come}</div>
          </div>

          <div style={{ background: color + '14', borderRadius: '8px', padding: '9px 11px', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: f(10), fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Come leggerlo
            </div>
            <div style={{ fontSize: f(11), color: '#394058', lineHeight: '1.65' }}>{leggere}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MODAL PRINCIPALE ────────────────────────────────────────
export default function HelpModal({ onClose, tokenData }) {
  const role = tokenData?.role || 'medico'
  const perms = tokenData?.permissions || {}

  let sezioni = []
  let titolo = ''
  let sottotitolo = ''

  if (role === 'toilet_writer') {
    sezioni = SEZIONI_TOILET_WRITER
    titolo = 'Guida educatore'
    sottotitolo = 'Come usare il registro sessioni'
  } else if (role === 'viewer') {
    sezioni = SEZIONI_VIEWER
    titolo = 'Guida visualizzatore'
    sottotitolo = 'Come leggere i dati'
  } else {
    // medico: filtra le sezioni in base ai permessi
    sezioni = SEZIONI_MEDICO(perms).filter(s => s.show)
    titolo = 'Guida medico'
    sottotitolo = 'Moduli attivi e come leggere i grafici'
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(2,21,63,0.55)',
          zIndex: 3000,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        maxHeight: '90dvh',
        background: '#f3f4f7',
        borderRadius: '24px 24px 0 0',
        zIndex: 3100,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(2,21,63,0.25)',
        fontFamily: "-apple-system,'Segoe UI',sans-serif",
      }}>
        {/* Handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#dde0ed' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px 14px',
          background: 'linear-gradient(135deg,#08184c,#193f9e)',
          borderRadius: '20px 20px 0 0',
          margin: '8px 12px 0',
          flexShrink: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <HelpCircle size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: f(16), fontWeight: '900', color: '#fff' }}>{titolo}</div>
            <div style={{ fontSize: f(10), color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{sottotitolo}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 32px' }}>
          {sezioni.map((s, i) => (
            <HelpCard key={s.key} sezione={s} defaultOpen={i === 0} />
          ))}

          {/* Footer */}
          <div style={{
            textAlign: 'center', fontSize: f(10), color: '#bec1cc',
            padding: '8px 16px', marginTop: '4px',
          }}>
            DamiAPP non sostituisce il parere medico professionale.
          </div>
        </div>
      </div>
    </>
  )
}

// ─── BOTTONE ? DA USARE NELLE PAGINE ────────────────────────
// Importa e usa così nel tuo componente:
//
//   import HelpButton from './HelpModal'   ← usa l'export named qui sotto
//   <HelpButton tokenData={tokenData} />
//
// Il bottone gestisce autonomamente l'apertura/chiusura del modale.

export function HelpButton({ tokenData, style = {} }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
      >
        <HelpCircle size={17} color="#fff" />
      </button>

      {open && (
        <HelpModal
          onClose={() => setOpen(false)}
          tokenData={tokenData}
        />
      )}
    </>
  )
}
