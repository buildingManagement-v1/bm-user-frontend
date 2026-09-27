function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix}`
}

/**
 * Rent collection days 1–31. Days past a month's end fall on its last day
 * (e.g. the 30th is 28 Feb), matching the backend's cycle generation.
 */
export const paymentDayOptions = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  return {
    value: day,
    label: day >= 29 ? `${ordinal(day)} (or the month's last day)` : `${ordinal(day)} of each month`,
  }
})
