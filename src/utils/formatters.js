/**
 * 本地化格式化工具：日期 YYYY-MM-DD、货币 ¥/$/HK$、涨跌幅（红涨绿跌语义）。
 */
import { format, parseISO } from 'date-fns'

/** 日期 → YYYY-MM-DD（容错字符串/Date）。 */
export function fmtDate(value) {
  if (!value) return '—'
  try {
    const d = typeof value === 'string' ? parseISO(value) : value
    return format(d, 'yyyy-MM-dd')
  } catch (e) {
    return String(value)
  }
}

/** 货币格式化，按 currency 前缀符号（CNY/¥、USD/$、HKD/HK$）。 */
export function fmtCurrency(amount, currency = 'CNY') {
  const sym = currency === 'USD' ? '$' : currency === 'HKD' ? 'HK$' : '¥'
  const n = Number(amount || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${sym}${n}`
}

/** 百分比（保留 1 位）。 */
export function fmtPct(n, digits = 1) {
  return `${Number(n || 0).toFixed(digits)}%`
}

/** 带正负号的百分比（用于涨跌幅）。 */
export function fmtSignedPct(n, digits = 2) {
  const v = Number(n || 0)
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`
}

/** 金额带正负号（用于盈亏）。 */
export function fmtSignedCurrency(amount, currency = 'CNY') {
  const sym = currency === 'USD' ? '$' : currency === 'HKD' ? 'HK$' : '¥'
  const v = Number(amount || 0)
  return `${v >= 0 ? '+' : '-'}${sym}${Math.abs(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}
