export type Category = 'streaming' | 'music' | 'food' | 'cloud' | 'fitness' | 'work' | 'shopping'

export interface AppPlan {
  n: string
  p: number
}

export interface App {
  id: string
  name: string
  cat: Category
  domain: string
  price: number       // default / lowest plan price
  multi: boolean      // has multiple pricing tiers
  plans?: AppPlan[]   // only if multi === true
  custom?: boolean    // set to true for user-added apps
}

export interface CustomApp extends App {
  custom: true
  domain: ''
}

export const APPS: App[] = [
  { id: 'netflix',     name: 'Netflix',        cat: 'streaming', domain: 'netflix.com',       price: 149,  multi: true,  plans: [{ n: 'Mobile', p: 149 }, { n: 'Basic', p: 199 }, { n: 'Standard', p: 499 }, { n: 'Premium', p: 649 }] },
  { id: 'hotstar',     name: 'JioHotstar',     cat: 'streaming', domain: 'hotstar.com',        price: 299,  multi: true,  plans: [{ n: 'Mobile', p: 299 }, { n: 'Super', p: 499 }, { n: 'Premium', p: 899 }] },
  { id: 'primevideo',  name: 'Prime Video',    cat: 'streaming', domain: 'primevideo.com',     price: 299,  multi: false },
  { id: 'sonyliv',     name: 'SonyLIV',        cat: 'streaming', domain: 'sonyliv.com',        price: 99,   multi: true,  plans: [{ n: 'Lite', p: 99 }, { n: 'Ad-Free', p: 299 }, { n: 'Premium+', p: 699 }] },
  { id: 'zee5',        name: 'ZEE5',           cat: 'streaming', domain: 'zee5.com',           price: 99,   multi: true,  plans: [{ n: 'Monthly', p: 99 }, { n: 'Annual (÷12)', p: 33 }] },
  { id: 'mxplayer',    name: 'MX Player',      cat: 'streaming', domain: 'mxplayer.in',        price: 99,   multi: false },
  { id: 'spotify',     name: 'Spotify',        cat: 'music',     domain: 'spotify.com',        price: 119,  multi: false },
  { id: 'jiosaavn',    name: 'JioSaavn Pro',   cat: 'music',     domain: 'jiosaavn.com',       price: 99,   multi: false },
  { id: 'ytpremium',   name: 'YT Premium',     cat: 'music',     domain: 'youtube.com',        price: 189,  multi: false },
  { id: 'applemusic',  name: 'Apple Music',    cat: 'music',     domain: 'music.apple.com',    price: 99,   multi: false },
  { id: 'swiggy',      name: 'Swiggy One',     cat: 'food',      domain: 'swiggy.com',         price: 299,  multi: false },
  { id: 'zomato',      name: 'Zomato Gold',    cat: 'food',      domain: 'zomato.com',         price: 199,  multi: false },
  { id: 'googleone',   name: 'Google One',     cat: 'cloud',     domain: 'one.google.com',     price: 130,  multi: true,  plans: [{ n: '100 GB', p: 130 }, { n: '200 GB', p: 210 }, { n: '2 TB', p: 650 }] },
  { id: 'icloud',      name: 'iCloud+',        cat: 'cloud',     domain: 'icloud.com',         price: 75,   multi: true,  plans: [{ n: '50 GB', p: 75 }, { n: '200 GB', p: 229 }, { n: '2 TB', p: 749 }] },
  { id: 'dropbox',     name: 'Dropbox',        cat: 'cloud',     domain: 'dropbox.com',        price: 875,  multi: false },
  { id: 'cultfit',     name: 'Cult.fit',       cat: 'fitness',   domain: 'cult.fit',           price: 899,  multi: false },
  { id: 'headspace',   name: 'Headspace',      cat: 'fitness',   domain: 'headspace.com',      price: 449,  multi: false },
  { id: 'linkedin',    name: 'LinkedIn',       cat: 'work',      domain: 'linkedin.com',       price: 2600, multi: false },
  { id: 'notion',      name: 'Notion',         cat: 'work',      domain: 'notion.so',          price: 1600, multi: false },
  { id: 'canva',       name: 'Canva Pro',      cat: 'work',      domain: 'canva.com',          price: 499,  multi: false },
  { id: 'adobe',       name: 'Adobe CC',       cat: 'work',      domain: 'adobe.com',          price: 1675, multi: false },
  { id: 'slack',       name: 'Slack',          cat: 'work',      domain: 'slack.com',          price: 538,  multi: false },
  { id: 'amazonprime', name: 'Amazon Prime',   cat: 'shopping',  domain: 'amazon.in',          price: 125,  multi: false },
  { id: 'myntra',      name: 'Myntra Insider', cat: 'shopping',  domain: 'myntra.com',         price: 99,   multi: false },
]

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'streaming', label: '🎬 Streaming' },
  { id: 'music',     label: '🎵 Music' },
  { id: 'food',      label: '🍔 Food' },
  { id: 'cloud',     label: '☁️ Cloud' },
  { id: 'fitness',   label: '💪 Fitness' },
  { id: 'work',      label: '💼 Work' },
  { id: 'shopping',  label: '🛍️ Shopping' },
]

// Logo URL — Google Favicon API (prototype-grade; replace with licensed assets for prod)
export function getLogoUrl(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
}

const COLORS = ['#0F4C81', '#2DD4BF', '#0ea5e9', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']
export function hashColor(id: string): string {
  let h = 0
  for (const c of id) h = ((h << 5) - h) + c.charCodeAt(0)
  return COLORS[Math.abs(h) % COLORS.length]
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}
