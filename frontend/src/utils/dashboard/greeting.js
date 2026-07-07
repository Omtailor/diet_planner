// ─── Greeting Helpers ───────────────────────────────────────────

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Resolves the display name from a profile object.
 * Falls back through: name → first_name → username → email local part → 'there'
 */
export function profileGreetingName(profile) {
  if (!profile) return 'there'
  const fullName = (profile.name || '').trim()
  if (fullName) return fullName.split(/\s+/)[0]
  const first = (profile.first_name || '').trim()
  if (first) return first.split(/\s+/)[0]
  const u = (profile.username || '').trim()
  if (u) return u
  const email = (profile.email || '').trim()
  const local = email.split('@')[0]
  if (local) return local
  return 'there'
}

/** Returns the uppercase first character for the avatar circle. */
export function profileAvatarInitial(profile) {
  const token = profileGreetingName(profile)
  if (token === 'there') return 'U'
  return token[0].toUpperCase()
}

/** e.g. "Monday, 7 July" */
export function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
