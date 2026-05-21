// Small helper that returns an avatar URL for a user.
// If the user has a custom `avatar` URL, we use it as-is. Otherwise we fall
// back to ui-avatars.com, which renders a clean SVG/PNG of the user's
// initials with our brand gold background — no extra dependency and works
// for every account out of the box.

const FALLBACK_BG = 'e8c547' // --cl-accent (cinema gold) without the #
const FALLBACK_FG = '0a0a0f' // --cl-bg

export function avatarUrl(user, size = 128) {
  if (!user) {
    return `https://ui-avatars.com/api/?name=?&background=${FALLBACK_BG}&color=${FALLBACK_FG}&size=${size}&bold=true`
  }

  if (user.avatar && user.avatar.trim()) return user.avatar.trim()

  // Use displayName for the initials, falling back to username so logged-in
  // users without a displayName still get something meaningful.
  const name = encodeURIComponent(user.displayName || user.username || 'User')

  return `https://ui-avatars.com/api/?name=${name}&background=${FALLBACK_BG}&color=${FALLBACK_FG}&size=${size}&bold=true`
}
