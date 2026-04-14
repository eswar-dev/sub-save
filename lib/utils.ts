export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getOptTintClass(value: string): string {
  const map: Record<string, string> = {
    'This week':          'q-opt-this-week',
    'This month':         'q-opt-this-month',
    'Over a month ago':   'q-opt-over-month',
    "Can't remember":     'q-opt-cant-remember',
    'Daily':              'q-opt-daily',
    'Few times a week':   'q-opt-few-times-week',
    'Weekly':             'q-opt-weekly',
    'Few times a month':  'q-opt-few-times-month',
    'Rarely':             'q-opt-rarely',
  }
  return map[value] ?? ''
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
