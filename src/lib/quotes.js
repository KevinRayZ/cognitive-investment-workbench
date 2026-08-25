/**
 * 实时行情抓取层 —— 浏览器直连东方财富 push2 公开接口。
 * CORS 已验证：push2.eastmoney.com 在带 Origin 时返回 Access-Control-Allow-Origin: <Origin>，
 * 故纯前端可直接跨域拉取实时行情，无需后端代理。
 *
 * 支持代码格式：601088 / 601088.SH / 02097.HK / 518880.SH 等。
 */

const PUSH2 = 'https://push2.eastmoney.com/api/qt/stock/get'

// 代码 → 东方财富 secid（市场.数字）。沪市=1，深市=0，港股=116。
export function secidOf(code) {
  if (!code) return null
  const c = String(code).trim()
  const num = c.replace(/\.[a-z]+$/i, '').replace(/\D/g, '')
  if (!num) return null
  if (/\.hk$/i.test(c)) return `116.${num}`
  if (/\.sh$/i.test(c)) return `1.${num}`
  if (/\.sz$/i.test(c)) return `0.${num}`
  // 无后缀：按数字前缀推断
  if (/^(60|68|90|9)/.test(num)) return `1.${num}`
  if (/^(00|30|2|8)/.test(num)) return `0.${num}`
  return `1.${num}`
}

const FIELDS = 'f43,f44,f45,f46,f57,f58,f60,f9,f23,f116,f117,f170,f169,f168'

function num(v) {
  if (v == null || v === '' || v === '-') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 抓取单标的实时行情。失败抛错（由调用方决定降级）。
 * @returns {{code,name,price,preClose,open,high,low,pe,pb,marketCap,floatCap,changePct,change,turnoverRate}}
 */
export async function getQuote(code) {
  const secid = secidOf(code)
  if (!secid) throw new Error(`无法解析代码：${code}`)
  const url = `${PUSH2}?secid=${secid}&fields=${FIELDS}&invt=2&fltt=2`
  const res = await fetch(url, { headers: { Referer: 'https://quote.eastmoney.com/' } })
  if (!res.ok) throw new Error(`行情接口 ${res.status}`)
  const json = await res.json()
  const d = json && json.data
  if (!d) throw new Error(`行情接口无数据：${code}`)
  return {
    code: d.f57,
    name: d.f58,
    price: num(d.f43),
    preClose: num(d.f60),
    open: num(d.f46),
    high: num(d.f44),
    low: num(d.f45),
    pe: num(d.f9),
    pb: num(d.f23),
    marketCap: num(d.f116), // 元
    floatCap: num(d.f117),
    changePct: num(d.f170),
    change: num(d.f169),
    turnoverRate: num(d.f168),
  }
}

/** 批量抓取（并发），单个失败不影响其他。 */
export async function getQuotes(codes = []) {
  const out = {}
  await Promise.all(
    codes.map(async (code) => {
      try {
        out[code] = await getQuote(code)
      } catch (e) {
        out[code] = { error: String(e && e.message ? e.message : e) }
      }
    }),
  )
  return out
}
