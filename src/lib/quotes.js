/**
 * 实时行情抓取层 —— 浏览器直连公开接口。
 * - A股/ETF、美股：东方财富 push2（CORS 已验证可跨域直连）
 * - 场外基金净值：天天基金 fundgz JSONP（script 注入，无 CORS 限制）
 *
 * 支持代码格式：601088 / 601088.SH / 02097.HK / 518880.SH / TSLL 等美股代码 / 001194 场外基金代码。
 */

const PUSH2 = 'https://push2.eastmoney.com/api/qt/stock/get'

// 美股 → 东方财富 secid（市场号：105=NASDAQ，106=NYSE，107=NYSE Arca/AMEX）
const US_SECID_OVERRIDES = {
  TSLL: '105.TSLL',
  MU: '105.MU',
  ALB: '106.ALB',
  BMNR: '105.BMNR',
  ARKK: '107.ARKK',
}

// 代码类型解析：us=美股实时行情，etf=场内基金（push2 股票接口），otcfund=场外基金（fundgz 净值）
export function resolveKind(code) {
  const c = String(code || '').trim().toUpperCase()
  if (!c) return null
  if (US_SECID_OVERRIDES[c] || /^[A-Z]{1,6}$/.test(c)) return 'us'
  if (/^(159|16[0-9]|15)/.test(c)) return 'etf' // 深市基金
  if (/^5/.test(c)) return 'etf' // 沪市 ETF
  if (/^\d{6}$/.test(c)) return 'otcfund' // 其余 6 位纯数字视为场外基金
  if (/\.hk$/i.test(c)) return 'etf'
  return 'etf'
}

// 代码 → 东方财富 secid（市场.数字）。沪市=1，深市=0，港股=116。
export function secidOf(code) {
  if (!code) return null
  const c = String(code).trim()
  const upper = c.toUpperCase()
  if (US_SECID_OVERRIDES[upper]) return US_SECID_OVERRIDES[upper]
  const num = c.replace(/\.[a-z]+$/i, '').replace(/\D/g, '')
  if (!num) return null
  if (/\.hk$/i.test(c)) return `116.${num}`
  if (/\.sh$/i.test(c)) return `1.${num}`
  if (/\.sz$/i.test(c)) return `0.${num}`
  // 深市基金（159xxx 等）优先于股票前缀规则
  if (/^(1[5-9])/.test(num)) return `0.${num}`
  if (/^5/.test(num)) return `1.${num}`
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

/**
 * 场外基金净值（天天基金 fundgz JSONP）。
 * 返回：{code,name,navDate,nav,estimate,estimatePct}；失败返回 {error}。
 */
export function getFundNav(code, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const cbName = `fundgz_cb_${code}_${Math.random().toString(36).slice(2, 8)}`
    const script = document.createElement('script')
    const timer = setTimeout(() => finish(`请求超时：${code}`), timeoutMs)
    let settled = false

    function finish(err, data) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { delete window[cbName] } catch (_) {}
      script.remove()
      resolve(err ? { error: err } : data)
    }

    window[cbName] = (raw) => {
      try {
        if (!raw || !raw.fundcode) return finish('无数据')
        const nav = Number(raw.dwjz)
        const est = Number(raw.gsz)
        const price = Number.isFinite(est) && est > 0 ? est : nav
        const preClose = Number.isFinite(est) && Number.isFinite(nav) && nav > 0 ? nav : null
        return finish(null, {
          code: raw.fundcode,
          name: raw.name || '',
          navDate: raw.jzrq || '',
          nav,
          estimate: est,
          estimatePct: num(raw.gszzl),
          price,
          preClose,
          changePct: num(raw.gszzl),
          source: 'fundgz',
        })
      } catch (e) {
        finish(String(e))
      }
    }
    script.onerror = () => finish(`加载失败：${code}`)
    script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}&cb=${cbName}`
    document.head.appendChild(script)
  })
}

/** 场内/美股单标的行情；kind 缺省时自动解析。 */
export async function getHoldingQuote(code) {
  const kind = resolveKind(code)
  if (kind === 'otcfund') return getFundNav(code)
  return getQuote(code)
}

/**
 * 持仓行情批量抓取：自动按代码类型分流（ETF/美股 → push2，场外基金 → fundgz）。
 * @returns {{[code]: quote}}
 */
export async function getHoldingQuotes(codes = []) {
  const out = {}
  await Promise.all(
    codes.map(async (code) => {
      try {
        out[code] = await getHoldingQuote(code)
      } catch (e) {
        out[code] = { error: String(e && e.message ? e.message : e) }
      }
    }),
  )
  return out
}
