export const COOKIE_CONSENT_COOKIE = 'cc_cookie'

function hasAnalyticsCategory(value: string) {
  try {
    const parsed = JSON.parse(value) as { categories?: unknown }
    return Array.isArray(parsed.categories) && parsed.categories.includes('analytics')
  } catch {
    return false
  }
}

export function hasAnalyticsConsent(value: string | undefined) {
  if (!value) return false
  if (hasAnalyticsCategory(value)) return true

  try {
    return hasAnalyticsCategory(decodeURIComponent(value))
  } catch {
    return false
  }
}
