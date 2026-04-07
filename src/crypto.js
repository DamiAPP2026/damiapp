import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = 'key_super_segreto_solo_per_te'

export function decrypt(encData) {
  if (!encData) return null
  if (typeof encData === 'object') return encData
  try {
    const bytes = CryptoJS.AES.decrypt(encData.toString(), ENCRYPTION_KEY)
    const str = bytes.toString(CryptoJS.enc.Utf8)
    return str ? JSON.parse(str) : null
  } catch {
    try { return JSON.parse(encData) } catch { return null }
  }
}

export function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString()
}

export function processFirebaseSnap(snapshot) {
  const val = snapshot.val()
  if (!val) return []
  const data = []
  Object.entries(val).forEach(([key, encData]) => {
    const item = decrypt(encData)
    if (item) {
      item._firebaseKey = key
      data.push(item)
    }
  })
  return data
}