// Application configuration sources (no localStorage anywhere):
//   - Repo coordinates (owner/repo/path/branch) come from public/appsettings.json
//   - The GitHub PAT comes from appsettings.json (github.token), falling back to
//     the VITE_GITHUB_TOKEN environment variable.

export async function loadAppConfig() {
  const res = await fetch(`${import.meta.env.BASE_URL}appsettings.json`, {
    cache: 'no-store'
  })
  if (!res.ok) {
    throw new Error(`Unable to load appsettings.json (HTTP ${res.status}).`)
  }
  const json = await res.json()
  const gh = json.github || {}
  // Token precedence: appsettings.json github.token, then VITE_GITHUB_TOKEN.
  const token = gh.token || import.meta.env.VITE_GITHUB_TOKEN || ''

  return {
    token,
    owner: gh.owner || '',
    repo: gh.repo || '',
    path: gh.path || 'todos.json',
    branch: gh.branch || 'main',
    theme: json.ui?.theme || 'dark',
    hasToken: Boolean(token)
  }
}

export function isConfigComplete(config) {
  return Boolean(
    config && config.token && config.owner && config.repo && config.path
  )
}
