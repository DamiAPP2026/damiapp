import { ChevronRight, Link, ShoppingBag, CreditCard, Phone, Shield } from 'lucide-react'

const f = (base) => `${Math.round(base * 1.15)}px`
const sh = '0 6px 24px rgba(2,21,63,0.10), 0 2px 8px rgba(0,0,0,0.05)'

const VOCI = [
  {
    key: 'condividi',
    Icon: Link,
    label: 'Condividi',
    sub: 'Accesso medici, token di condivisione',
    page: 'condividi',
  },
  {
    key: 'cosa_portare',
    Icon: ShoppingBag,
    label: 'Cosa portare',
    sub: 'Liste per visite, gite, emergenze',
    page: 'cosa_portare',
  },
  {
    key: 'pagamenti',
    Icon: CreditCard,
    label: 'Pagamenti',
    sub: 'Terapisti, visite, spese mediche',
    page: 'pagamenti',
  },
  {
    key: 'rubrica',
    Icon: Phone,
    label: 'Rubrica',
    sub: 'Medici, terapisti, contatti utili',
    page: 'rubrica',
  },
]

export default function UtilityPage({ onBack, isDemo, onNavigate }) {
  return (
    <>
      <style>{`\n        *{box-sizing:border-box;}body{margin:0;background:#f3f4f7;}\n        .ut-wrap{background:#f3f4f7;min-height:100vh;font-family:-apple-system,'Segoe UI',sans-serif;padding-bottom:100px;width:100%;max-width:480px;margin:0 auto;}\n      `}</style>
      <div className="ut-wrap">
        <div style={{background:'linear-gradient(135deg,#394058,#08184c)',padding:'14px 16px 28px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <button onClick={onBack} style={{width:'36px',height:'36px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <ChevronRight size={20} color="#fff" style={{transform:'rotate(180deg)'}} />
            </button>
            <div>
              <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>Utility</div>
              <div style={{fontSize:f(11),color:'rgba(255,255,255,0.65)'}}>{isDemo ? 'Modalità demo' : 'Strumenti e documenti'}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {[
              {label:'Sezioni',val:'4'},
              {label:'Disponibili',val:'4'},
              {label:'In arrivo',val:'0'},
            ].map(({label,val},i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.12)',borderRadius:'12px',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:f(20),fontWeight:'900',color:'#fff'}}>{val}</div>
                <div style={{fontSize:f(10),color:'rgba(255,255,255,0.65)',marginTop:'1px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'12px'}}>
          <div style={{fontSize:f(12),color:'#7c8088',fontWeight:'600',marginBottom:'10px',marginTop:'2px'}}>Tocca una sezione per aprirla</div>

          {VOCI.map(({key, Icon, label, sub, page}) => (
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
                position:'relative',
                overflow:'hidden',
              }}
            >
              <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'#EEF3FD',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid #dde6fb'}}>
                <Icon size={20} color="#193f9e" strokeWidth={2.1}/>
              </div>

              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px'}}>
                  <span style={{fontSize:f(14),fontWeight:'800',color:'#02153f'}}>{label}</span>
                </div>
                <div style={{fontSize:f(11),color:'#7c8088',lineHeight:'1.4'}}>{sub}</div>
              </div>

              <ChevronRight size={18} color="#bec1cc"/>
            </div>
          ))}

          <div style={{background:'#EEF3FD',borderRadius:'14px',padding:'12px 14px',marginTop:'6px',border:'1.5px solid #193f9e22',display:'flex',gap:'10px',alignItems:'flex-start'}}>
            <Shield size={16} color="#193f9e" style={{flexShrink:0,marginTop:'2px'}}/>
            <div style={{fontSize:f(11),color:'#193f9e',lineHeight:'1.6'}}>
              I documenti medici e personali si trovano nella sezione <strong>Documenti</strong> della barra di navigazione.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
