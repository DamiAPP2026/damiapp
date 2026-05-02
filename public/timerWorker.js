// timerWorker.js
// Metti questo file in /public/timerWorker.js

let interval = null
let seconds = 0

self.onmessage = (e) => {
  const { type, initialSeconds } = e.data

  if (type === 'START') {
    seconds = initialSeconds ?? seconds
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      seconds++
      self.postMessage({ type: 'TICK', seconds })
    }, 1000)
  }

  if (type === 'STOP') {
    clearInterval(interval)
    interval = null
  }

  if (type === 'RESET') {
    clearInterval(interval)
    interval = null
    seconds = 0
    self.postMessage({ type: 'TICK', seconds: 0 })
  }

  if (type === 'SET') {
    seconds = initialSeconds ?? 0
  }
}
