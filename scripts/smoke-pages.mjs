/**
 * 页面冒烟检查（零依赖，走 Chrome DevTools Protocol）。
 *
 * 为什么需要它：esbuild/vite 只做静态打包，不检查运行时引用。历史教训是
 * 「build 通过但打开页面直接白屏」。本脚本逐个路由真实加载，收集 console
 * error / 未捕获异常 / React 崩溃特征，用于发布前回归。
 *
 * 用法：
 *   1) 先起 dev server：npm run dev
 *   2) node scripts/smoke-pages.mjs [baseUrl]
 *      例：node scripts/smoke-pages.mjs http://localhost:5173
 *
 * 退出码：0 = 全部通过；1 = 存在错误页面
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BASE = process.argv[2] || 'http://localhost:5173'
const PORT = 9229
const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

// 与 src/router.jsx 保持一致：新增路由请同步这里
const ROUTES = [
  ['/', '首页看板'],
  ['/principle?view=l1', '投资哲学'],
  ['/methods', '策略方法'],
  ['/research', '标的研究-列表'],
  ['/research/159139', '标的研究-详情'],
  ['/trade', '交易决策'],
  ['/review', '复盘错误'],
  ['/inspiration', '观察灵感'],
  ['/strategy', '策略中心'],
  ['/score-engine', '评分引擎'],
  ['/funds', '基金管理'],
  ['/fund-analyze', '基金穿透分析'],
  ['/industry-watch', '行业观察'],
  ['/asset-views', '资产观点'],
  ['/daily-brief', '日度简报'],
  ['/weekly-report', '周度分析'],
  ['/monthly-brief', '月度思路'],
  ['/memo', '投资备忘录'],
  ['/chat', 'AI 对话'],
  ['/memory', '三层记忆'],
  ['/ai-protocol', 'AI 协作协议'],
  ['/settings', '设置'],
]

function findBrowser() {
  for (const p of EDGE_CANDIDATES) if (existsSync(p)) return p
  throw new Error('未找到 Edge/Chrome，无法执行页面冒烟检查')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function httpJson(url, method = 'GET') {
  // 新版 Chrome/Edge 的 /json/new 要求 PUT，GET 返回 405
  const res = await fetch(url, { method })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

async function main() {
  const browser = findBrowser()
  const userDataDir = path.join(root, '.smoke-profile')
  const proc = spawn(
    browser,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore', detached: false }
  )

  const cleanup = () => {
    try {
      proc.kill()
    } catch {}
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })

  // 等待调试端口就绪
  let version = null
  for (let i = 0; i < 40; i++) {
    try {
      version = await httpJson(`http://127.0.0.1:${PORT}/json/version`)
      break
    } catch {
      await sleep(250)
    }
  }
  if (!version) {
    cleanup()
    throw new Error('浏览器调试端口未就绪')
  }

  const target = await httpJson(`http://127.0.0.1:${PORT}/json/new?about:blank`, 'PUT')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })

  let msgId = 0
  const pending = new Map()
  const errors = []
  let currentRoute = ''

  ws.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
      const text = (msg.params.args || [])
        .map((a) => a.value ?? a.description ?? a.type)
        .join(' ')
      errors.push({ route: currentRoute, kind: 'console.error', text })
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params?.exceptionDetails || {}
      errors.push({
        route: currentRoute,
        kind: 'exception',
        text: d.exception?.description || d.text || 'unknown',
      })
    }
  }

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          reject(new Error(`CDP timeout: ${method}`))
        }
      }, 15000)
    })

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')

  const results = []
  for (const [route, name] of ROUTES) {
    currentRoute = route
    const before = errors.length
    // cache-busting：绕过 vite ETag/304，确保真实重新加载
    const url = `${BASE}${route}${route.includes('?') ? '&' : '?'}_t=${Date.now()}`
    await send('Page.navigate', { url })

    // vite dev 首次访问路由会按需编译，固定 sleep 会误判为白屏 → 轮询等待挂载
    const probe = `(() => {
      const r = document.getElementById('root');
      return JSON.stringify({
        len: r ? r.innerHTML.length : -1,
        bodyText: (document.body.innerText || '').slice(0, 120)
      });
    })()`
    let info = { len: -1, bodyText: '' }
    for (let i = 0; i < 30; i++) {
      await sleep(700)
      const dom = await send('Runtime.evaluate', { expression: probe, returnByValue: true })
      try {
        info = JSON.parse(dom.result.value)
      } catch {}
      if (info.len > 0) break
    }

    const raw = errors.slice(before)
    // 样式类告警（MUI/emotion 属性写法提示）不阻断，单独归为 WARN
    const hard = raw.filter((e) => !/kebab-case|Did you mean/i.test(e.text))
    const warn = raw.filter((e) => /kebab-case|Did you mean/i.test(e.text))
    const crashed = info.len <= 0 || /Minified React error|Uncaught/i.test(info.bodyText)
    results.push({ route, name, domLen: info.len, crashed, errors: hard, warns: warn })
    const status = crashed || hard.length ? 'FAIL' : warn.length ? 'WARN' : 'OK'
    console.log(
      `${status.padEnd(4)} ${route.padEnd(22)} ${String(name).padEnd(10)} dom=${info.len}` +
        (hard.length ? `  错误${hard.length}条` : '') +
        (warn.length ? `  告警${warn.length}条` : '')
    )
    for (const e of [...hard, ...warn].slice(0, 4)) {
      console.log(`      [${e.kind}] ${String(e.text).slice(0, 220)}`)
    }
  }

  ws.close()
  cleanup()

  const failed = results.filter((r) => r.crashed || r.errors.length)
  const warned = results.filter((r) => !failed.includes(r) && r.warns.length)
  console.log('\n================ 汇总 ================')
  console.log(
    `检查路由 ${results.length} 个｜崩溃/报错 ${failed.length} 个｜样式告警 ${warned.length} 个`
  )
  if (failed.length) {
    console.log('崩溃/报错路由：')
    failed.forEach((f) => console.log(`  - ${f.route} (${f.name})`))
  }
  if (warned.length) {
    console.log('样式告警路由（不阻断，建议修）：')
    warned.forEach((f) => console.log(`  - ${f.route} (${f.name})`))
  }
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error('冒烟检查失败：', e.message)
  process.exit(1)
})
