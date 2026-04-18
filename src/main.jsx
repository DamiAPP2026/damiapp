import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Aspetta che React abbia effettivamente dipinto il primo frame
// prima di segnalare che il caricamento è finito.
// Il requestAnimationFrame doppio garantisce che il browser
// abbia committato il paint — così la splash HTML è già
// visibile e la transizione dalla splash nativa è invisibile.
if (typeof window.__damiSplashDone === 'function') {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__damiSplashDone()
    })
  })
}
