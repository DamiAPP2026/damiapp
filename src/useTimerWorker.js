// useTimerWorker.js
// Hook riutilizzabile per timer con Web Worker + Wake Lock
// Metti in /src/useTimerWorker.js

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimerWorker(initialSeconds = 0) {
  const [timerSec, setTimerSec] = useState(initialSeconds)
  const [running, setRunning]   = useState(false)
  const workerRef               = useRef(null)
  const wakeLockRef             = useRef(null)

  // Inizializza il worker una sola volta
  useEffect(() => {
    workerRef.current = new Worker('/timerWorker.js')
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK') {
        setTimerSec(e.data.seconds)
      }
    }
    // Imposta il valore iniziale
    if (initialSeconds > 0) {
      workerRef.current.postMessage({ type: 'SET', initialSeconds })
    }
    return () => {
      workerRef.current?.terminate()
      releaseWakeLock()
    }
  }, [])

  // Wake Lock helpers
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      wakeLockRef.current.addEventListener('release', () => {
        // Il sistema ha revocato il lock (es. batteria scarica):
        // se il timer gira ancora, riacquistalo quando la pagina torna visibile
        wakeLockRef.current = null
      })
    } catch (err) {
      // Wake Lock non disponibile in questo momento (es. schermo già spento)
      console.warn('Wake Lock non ottenuto:', err.message)
    }
  }

  async function releaseWakeLock() {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }

  // Riacquista il Wake Lock quando la pagina torna visibile e il timer gira
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && running && !wakeLockRef.current) {
        await requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [running])

  const startTimer = useCallback(async (fromSeconds) => {
    setRunning(true)
    const init = fromSeconds !== undefined ? fromSeconds : undefined
    workerRef.current?.postMessage({ type: 'START', initialSeconds: init })
    await requestWakeLock()
  }, [])

  const stopTimer = useCallback(async () => {
    setRunning(false)
    workerRef.current?.postMessage({ type: 'STOP' })
    await releaseWakeLock()
  }, [])

  const resetTimer = useCallback(async () => {
    setRunning(false)
    workerRef.current?.postMessage({ type: 'RESET' })
    await releaseWakeLock()
  }, [])

  return { timerSec, running, startTimer, stopTimer, resetTimer, setTimerSec }
}
