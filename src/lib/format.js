// Small, pure display helpers. Currency is EGP everywhere in the MVP.

const egp = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** "EGP 150" or "EGP 150.50" — no trailing .00 for whole amounts. */
export function formatEGP(amount) {
  const rounded = Math.round(Number(amount) * 100) / 100
  return `EGP ${egp.format(rounded)}`
}

// Keyword → emoji for auto-categorizing an expense by its description. Covers
// English, Arabic, and Franco-Arabic (Arabizi, e.g. "3asha", "2ahwa", "banzine").
// First match wins, so order from more specific to more general.
const EMOJI_RULES = [
  ['🏠', ['house', 'chalet', 'hotel', 'airbnb', 'villa', 'apartment', 'rental', 'cabin', 'شاليه', 'فندق', 'شقة', 'بيت', 'منزل', 'ايجار', 'إيجار', 'fondo', 'sha2a']],
  ['🐟', ['fish', 'seafood', 'سمك', 'samak', 'asmak']],
  ['🍕', ['pizza', 'burger', 'koshari', 'koshary', 'shawarma', 'shawerma', 'feteer', 'crepe', 'بيتزا', 'برجر', 'برغر', 'كشري', 'شاورما', 'فطير', 'كريب']],
  ['☕', ['coffee', 'cafe', 'café', 'nescafe', 'tea', 'قهوة', 'ahwa', 'a7wa', '2ahwa', 'كافيه', 'شاي', 'shay']],
  ['🍺', ['beer', 'drinks', 'wine', 'cocktail', 'بيرة', 'مشروبات', 'نبيت']],
  ['🍽️', ['dinner', 'lunch', 'food', 'meal', 'eat', 'restaurant', 'breakfast', 'brunch', 'snack', 'عشاء', 'غداء', 'فطار', 'فطور', 'اكل', 'أكل', 'مطعم', 'عزومة', '3asha', '3esha', 'ghada', 'ftar', 'fetar', 'akl', 'mat3am', 'matam', '3azoma']],
  ['🛒', ['groc', 'grocery', 'market', 'supermarket', 'carrefour', 'kazyon', 'seoudi', 'hyper', 'shopping', 'بقالة', 'سوق', 'سوبر', 'كارفور', 'كازيون', 'تموين', 'ba2ala', 'sou2', 'souk', 'tamween']],
  ['⛽', ['gas', 'fuel', 'petrol', 'benzin', 'banzine', 'benzine', 'banzeen', 'بنزين', 'وقود']],
  ['🚗', ['car', 'taxi', 'uber', 'careem', 'ride', 'transport', 'toll', 'parking', 'تاكسي', 'أوبر', 'اوبر', 'كريم', 'مواصلات', 'عربية', 'أجرة', 'اجرة', 'جراج', '3arabeya', 'tawseela']],
  ['🎟️', ['ticket', 'entry', 'entrance', 'tour', 'museum', 'cinema', 'movie', 'film', 'concert', 'تذكرة', 'تذاكر', 'دخول', 'متحف', 'سينما', 'فيلم', 'tazkara']],
  ['🏖️', ['beach', 'resort', 'pool', 'بحر', 'شاطئ', 'منتجع', 'مسبح', 'ساحل', 'ba7r', 'bahr', 'sahel']],
]

// Latin/Franco terms match at a word start (so "gas" doesn't fire inside
// "Vegas"); Arabic (non-ASCII) terms match anywhere, since ASCII word boundaries
// don't apply to Arabic script. Precompiled once at load.
const isAscii = (k) => [...k].every((ch) => ch.charCodeAt(0) < 128)
const COMPILED = EMOJI_RULES.map(([emoji, keywords]) => ({
  emoji,
  arabic: keywords.filter((k) => !isAscii(k)),
  latin: keywords
    .filter(isAscii)
    .map((k) => new RegExp(`(^|[^a-z0-9])${k}`)),
}))

/**
 * Pick an emoji for an expense from its description. Returns a generic receipt
 * (🧾) when the text is blank or nothing matches. Pure and case-insensitive;
 * understands English, Arabic, and Franco-Arabic.
 */
export function categoryEmoji(text) {
  const s = String(text ?? '').toLowerCase()
  if (!s.trim()) return '🧾'
  for (const { emoji, arabic, latin } of COMPILED) {
    if (arabic.some((k) => s.includes(k)) || latin.some((re) => re.test(s))) {
      return emoji
    }
  }
  return '🧾'
}

/** Up to two uppercase initials from a name. "Yara Kamel" -> "YK", "Yara" -> "Y". */
export function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", else "18 Jun". */
export function formatWhen(iso, now = Date.now()) {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffSec = Math.max(0, Math.round((now - then) / 1000))

  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
