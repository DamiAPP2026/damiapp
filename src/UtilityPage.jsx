import { ChevronRight, Link, ShoppingBag, FileText, CreditCard, Phone, Shield } from 'lucide-react'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

const VOCI = [
  {
    key: 'condividi',
    Icon: Link,
    label: 'Condividi',
    sub: 'Accesso medici, token di condivisione',
    grad: 'linear-gradient(135deg,#193f9e,#2e84e9)',
    color: '#193f9e',
    bg: '#EEF3FD',
    page: 'condividi',
  },
  {
    key: 'cosa_portare',
    Icon: ShoppingBag,
    label: 'Cosa portare',
    sub: 'Liste per visite, gite, emergenze',
    grad: 'linear-gradient(135deg,#FF8C42,#FFD93D)',
    color: '#FF8C42',
    bg: '#FFF5EE',
    page: 'cosa_portare',
  },
  {
    key: 'doc_personali',
    Icon: FileText,
    label: 'Documenti personali',
    sub: 'Tessera sanitaria, documenti identità',
    grad: 'linear-gradient(135deg,#7B5EA7,#2e84e9)',
    color: '#7B5EA7',
    bg: '#F5F3FF',
    page: 'doc_personali',
  },
  {
    key: 'doc_medici',
    Icon: FileText,
    label: 'Documenti medici',
    sub: 'Referti, EEG, certificati, ricette',
    grad: 'linear-gradient(135deg,#2e84e9,#00BFA6)',
    color: '#2e84e9',
    bg: '#EEF3FD',
    page: 'doc_medici',
  },
  {
    key: 'pagamenti',
    Icon: CreditCard,
    label: 'Pagamenti',
    sub: 'Terapisti, visite, spese mediche',
    grad: 'linear-gradient(135deg,#00BFA6,#193f9e)',
    color: '#00BFA6',
    bg: '#E8FBF8',
    page: 'pagamenti',
  },
  {
    key: 'rubrica',
    Icon: Phone,
    label: 'Rubrica',
    sub: 'Medici, terapisti, contatti utili',
    grad: 'linear-gradient(135deg,#F7295A,#FF8C42)',
    color: '#F7295A',
    bg: '#FEF0F4',
    page: 'rubrica',
  },
]

export default function UtilityPage({ onBack, isDemo, onNavigate }) {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}
        .ut-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}
      `}</style>
      <div className="ut-wrap">

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#394058,#08184c)',padding:'14px 16px 28px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>Utility</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.65)'}}>
                {isDemo ? '🎭 Modalità demo' : 'Strumenti e documenti'}
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {[
              {label:'Sezioni',val:'6'},
              {label:'Disponibili',val:'2'},
              {label:'In arrivo',val:'4'},
            ].map(({label,val},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.12)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.65)',marginTop:'1px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'12px'}}>

          <div style={{fontSize:f(12),color:'#7c8088',fontWeight:'600',marginBottom:'10px',marginTop:'2px'}}>
            Tocca una sezione per aprirla
          </div>

          {VOCI.map(({key, Icon, label, sub, grad, color, bg, page}) => {
            // Condividi e Rubrica sono implementate; le altre in arrivo
            const disponibile = key === 'condividi' || key === 'rubrica' || key === 'cosa_portare'
            return (
              <div
                key={key}
                onClick={() => onNavigate(page)}
                style={{
                  background:'#feffff',
                  borderRadius:'18px',
                  padding:'14px',
                  marginBottom:'9px',
                  boxShadow:sh,
                  display:'flex',
                  alignItems:'center',
                  gap:'14px',
                  cursor:'pointer',
                  touchAction:'manipulation',
                  opacity: 1,
                  position:'relative',
                  overflow:'hidden',
                }}
              >
                {/* Icona */}
                <div style={{width:'48px',height:'48px',borderRadius:'14px',background:grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 4px 14px ${color}44`}}>
                  <Icon size={22} color="#fff"/>
                </div>

                {/* Testo */}
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px'}}>
                    <span style={{fontSize:f(14),fontWeight:'800',color:'#02153f'}}>{label}</span>
                    {!disponibile && (
                      <span style={{fontSize:f(9),fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:'#f3f4f7',color:'#bec1cc'}}>
                        In arrivo
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:f(11),color:'#7c8088',lineHeight:'1.4'}}>{sub}</div>
                </div>

                {/* Arrow */}
                <ChevronRight size={18} color={color}/>
              </div>
            )
          })}

          {/* Box info */}
          <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginTop:'6px',border:'1.5px solid #193f9e22',display:'flex',gap:'10px',alignItems:'flex-start'}}>
            <Shield size={16} color="#193f9e" style={{flexShrink:0,marginTop:'2px'}}/>
            <div style={{fontSize:f(11),color:'#193f9e',lineHeight:'1.6'}}>
              Le sezioni <strong>In arrivo</strong> saranno disponibili nei prossimi aggiornamenti. I dati già inseriti sono al sicuro.
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
