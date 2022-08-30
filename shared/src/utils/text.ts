export function getRandomString(
  length: number,
  chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
) {
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

interface ParseTimestampOptions {
  noDateSymbol: string
  onlyDate: boolean
  onlyTime: boolean
}

export function parseTimestamp(
  timestamp?: number | Date,
  opts: Partial<ParseTimestampOptions> = {},
) {
  if (timestamp === null || timestamp === undefined) {
    return opts.noDateSymbol ?? '-'
  }

  const dt = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const locale = 'pl'

  if (opts.onlyDate && !opts.onlyTime) {
    return dt.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } else if (opts.onlyTime) {
    return dt.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return dt.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
