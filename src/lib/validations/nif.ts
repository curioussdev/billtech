/** Valida o dígito de controlo do NIF português (módulo 11) — 9 dígitos, sem espaços nem outros carateres. */
export function isValidNif(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false
  const digits = value.split('').map(Number)
  const sum = digits.slice(0, 8).reduce((acc, d, i) => acc + d * (9 - i), 0)
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder
  return checkDigit === digits[8]
}
