/**
 * 每日市场动态自动提取（每天 18:00 由 Windows 计划任务调用）。
 *
 * 从「张湧的小密圈」拉取当天「市场动态分析」帖子，写入 public/circle-daily.json，
 * 供工作台日度简报页读取存档（即使工作台未打开也不漏数据）。
 *
 * 凭证：项目根目录 .circle-token（已 gitignore，与浏览器中 edu24ol_token 一致，失效后更新该文件）。
 * 运行：node scripts/circle-daily.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const TAG_DAILY = 2189 // 市场动态分析

function loadToken() {
  try {
    const t = readFileSync(path.join(root, '.circle-token'), 'utf8').trim()
    if (t) return t
  } catch {}
  throw new Error('缺少 .circle-token 凭证文件（项目根目录），请填入环球青藤 edu24ol_token')
}

function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const token = loadToken()
const url =
  'https://japi.hqwx.com/circle/v1/detail/articleList' +
  '?_appid=wwwhqqt&appid=wwwhqqt&_org_id=2&org_id=2&_os=3&os=3&_v=1.0.0&v=1.0.0&schId=2&pschId=14&platform=web' +
  `&circleId=259211&tagId=${TAG_DAILY}&from=0&rows=20` +
  `&edu24ol_token=${encodeURIComponent(token)}&passport=${encodeURIComponent(token)}` +
  `&_t=${Date.now()}`

const res = await fetch(url)
if (!res.ok) {
  console.error(`HTTP ${res.status}`)
  process.exit(1)
}
const json = await res.json()
if (json.status?.code !== 0) {
  console.error(`接口异常：${json.status?.msg || 'unknown'}（凭证可能已失效，请更新 .circle-token）`)
  process.exit(1)
}

// 仅保留当天帖子（超出当日即为无效数据）
const now = new Date()
const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
const items = (Array.isArray(json.data) ? json.data : [])
  .map((a) => ({
    id: a.id,
    ts: a.publishDate || 0,
    author: a.publisher?.nickName || '—',
    content: (a.pureContent || '').replace(/^#\S+\s*/, '').trim(),
  }))
  .filter((i) => i.ts >= dayStart.getTime())
  .sort((a, b) => b.ts - a.ts)

const out = { date: isoDate(now), fetchedAt: now.toISOString(), count: items.length, items }
writeFileSync(path.join(root, 'public', 'circle-daily.json'), JSON.stringify(out, null, 2), 'utf8')
console.log(`OK ${out.date}: 存档 ${items.length} 条当日市场动态`)
