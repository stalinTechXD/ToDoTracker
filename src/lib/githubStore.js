// GitHub Contents API storage layer.
// This module treats a JSON file inside a separate GitHub repository as the
// application's "database". It reads and writes that file using the REST API,
// tracking the blob `sha` so updates are performed safely (no external DB).

const API_ROOT = 'https://api.github.com'

// --- UTF-8 safe base64 helpers -------------------------------------------
// btoa/atob only handle Latin1, so we round-trip through TextEncoder/Decoder
// to correctly preserve emoji, accents and other multi-byte characters.
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function decodeBase64(b64) {
  const binary = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export class GitHubStorageError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GitHubStorageError'
    this.status = status
  }
}

export function createGitHubStore(config) {
  const { token, owner, repo, path, branch = 'main' } = config

  function assertConfigured() {
    if (!token || !owner || !repo || !path) {
      throw new GitHubStorageError('GitHub storage is not fully configured.', 0)
    }
  }

  function headers() {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }

  const contentsUrl = () =>
    `${API_ROOT}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`

  async function parseError(res) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body?.message) detail = body.message
    } catch {
      /* ignore */
    }
    return new GitHubStorageError(detail, res.status)
  }

  // Verify the token + repo are reachable and return basic repo info.
  async function verify() {
    assertConfigured()
    const res = await fetch(
      `${API_ROOT}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      { headers: headers() }
    )
    if (!res.ok) throw await parseError(res)
    const repoInfo = await res.json()
    return {
      fullName: repoInfo.full_name,
      private: repoInfo.private,
      defaultBranch: repoInfo.default_branch,
      permissions: repoInfo.permissions
    }
  }

  // Load the data file. Returns { data, sha } or { data: null, sha: null }
  // when the file does not exist yet.
  async function load() {
    assertConfigured()
    const res = await fetch(`${contentsUrl()}?ref=${encodeURIComponent(branch)}`, {
      headers: headers()
    })
    if (res.status === 404) return { data: null, sha: null }
    if (!res.ok) throw await parseError(res)
    const body = await res.json()
    const text = decodeBase64(body.content || '')
    let data = null
    try {
      data = text.trim() ? JSON.parse(text) : null
    } catch {
      throw new GitHubStorageError('Remote file is not valid JSON.', 422)
    }
    return { data, sha: body.sha }
  }

  async function putContents(content, sha, message) {
    const payload = {
      message: message || `chore: update todos (${new Date().toISOString()})`,
      content,
      branch
    }
    if (sha) payload.sha = sha
    return fetch(contentsUrl(), {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  // Persist the data file. When the file (and any parent folder such as
  // "orbittasks/") does not exist yet, GitHub's Contents API creates the file
  // and every intermediate folder automatically on this first PUT. If our
  // cached `sha` is stale or missing for an existing file, we re-read the
  // current sha and retry once so the write always succeeds.
  async function save(data, sha, message) {
    assertConfigured()
    const content = encodeBase64(JSON.stringify(data, null, 2))

    let res = await putContents(content, sha, message)

    // 409/422 = sha conflict (file already exists but our sha is missing/stale).
    if ((res.status === 409 || res.status === 422) ) {
      const current = await load()
      res = await putContents(content, current.sha || undefined, message)
    }

    if (!res.ok) throw await parseError(res)
    const body = await res.json()
    return { sha: body.content.sha, commit: body.commit.sha }
  }

  return { verify, load, save }
}

// Talks to the Netlify serverless function instead of GitHub directly. The
// function holds the token, so nothing secret is exposed to the browser. The
// wire format mirrors the direct store: base64 content in/out, same returns.
function createProxyStore(config) {
  const { owner, repo, path, branch = 'main' } = config
  const ENDPOINT = '/.netlify/functions/gh'

  async function call(action, extra) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, owner, repo, path, branch, ...extra })
    })
    let body = null
    try {
      body = await res.json()
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      throw new GitHubStorageError(body?.error || res.statusText, res.status)
    }
    return body || {}
  }

  async function verify() {
    return call('verify')
  }

  async function load() {
    const { content, sha } = await call('load')
    if (!sha && content == null) return { data: null, sha: null }
    const text = content ? decodeBase64(content) : ''
    let data = null
    try {
      data = text.trim() ? JSON.parse(text) : null
    } catch {
      throw new GitHubStorageError('Remote file is not valid JSON.', 422)
    }
    return { data, sha }
  }

  async function save(data, sha, message) {
    const content = encodeBase64(JSON.stringify(data, null, 2))
    const { sha: newSha, commit } = await call('save', { content, sha, message })
    return { sha: newSha, commit }
  }

  return { verify, load, save }
}
