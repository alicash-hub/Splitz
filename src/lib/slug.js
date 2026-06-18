// Short, URL-friendly trip slugs (e.g. "k7m2qp") for app.com/t/<slug>.
// Alphabet excludes ambiguous characters (0/O, 1/l/I) so a slug is easy to read
// aloud or copy from a screen.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const SLUG_LENGTH = 6

export function generateSlug(length = SLUG_LENGTH) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return slug
}
