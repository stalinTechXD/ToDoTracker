export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase()
}

// Best-effort URL extraction so users can paste raw links into notes and have
// them recognised, plus explicit link chips they attach to a task.
const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi

export function extractUrls(text = '') {
  const matches = text.match(URL_RE)
  return matches ? Array.from(new Set(matches)) : []
}

export function normalizeUrl(input = '') {
  const value = input.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`
  return value
}

export function isValidUrl(input = '') {
  try {
    const u = new URL(normalizeUrl(input))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function hostOf(url = '') {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
