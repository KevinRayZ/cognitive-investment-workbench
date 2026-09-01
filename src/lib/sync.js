/**
 * 在线同步层 —— 纯前端把 store 中的运行数据读写到 GitHub 私有仓库 investment-data。
 * 启动时 pullAll() 拉取云端数据 hydrate；写操作后 pushEntity() 防抖推送。
 * 带 sha 缓存与冲突重试（跨设备同时改动时自动重拉最新 sha 再写）。
 */
import { getGithubToken } from './credentials'
import { readJson, writeJson, REPO_DATA } from './githubClient'

// 本地 store 实体 → 云端集合文件 映射
//
// ⚠️ 必须与 src/store/useStore.js 的 ENTITY_META 保持一致：新增实体时两边都要登记，
// 否则该实体只会落在浏览器本地，换设备或清缓存即丢失（历史上 v2.9~v2.11 的
// assetViews / dailyBriefs / weeklyReports / monthlyBriefs 等就因漏登记而从未上云）。
export const SYNC_COLLECTIONS = {
  principles: 'principles.json',
  l1: 'l1.json',
  methods: 'methods.json',
  targets: 'targets.json',
  trades: 'trades.json',
  reviews: 'reviews.json',
  observations: 'observations.json',
  memos: 'memos.json',
  materials: 'materials.json',
  logs: 'logs.json',
  funds: 'funds.json',
  industryWatches: 'industry-watches.json',
  strategies: 'strategies.json',
  monthlyStrategies: 'monthly-strategies.json',
  scoreCards: 'score-cards.json',
  fundAnalysisJobs: 'fund-analysis-jobs.json',
  assetViews: 'asset-views.json',
  targetStates: 'target-states.json',
  dailyBriefs: 'daily-briefs.json',
  weeklyReports: 'weekly-reports.json',
  monthlyBriefs: 'monthly-briefs.json',
  dashboard: 'dashboard.json', // 单一对象，非数组
  analysis: 'analysis-cache.json', // 单一对象，非数组
}

// 单一对象（非数组集合），读取/写入逻辑与数组集合不同
const SINGLE_OBJECTS = new Set(['dashboard', 'analysis'])

let shaCache = {} // entity -> sha（内存，用于乐观写入）

/** 重置 sha 缓存（如切换账号时）。 */
export function resetSyncCache() {
  shaCache = {}
}

/** 从 GitHub 拉取所有集合，返回 { result: {entity:[records]}, shaMap }；无 token 返回 null。 */
export async function pullAll() {
  const token = getGithubToken()
  if (!token) return null
  const result = {}
  const shaMap = {}

  // 21 个集合串行拉取会明显拖慢启动 → 并发。
  // 单个文件缺失（新实体首次上云前）必须静默跳过，不能让整个拉取失败。
  await Promise.all(
    Object.entries(SYNC_COLLECTIONS).map(async ([entity, file]) => {
      try {
        const { data, sha } = await readJson(REPO_DATA, file, token)
        const isSingle = SINGLE_OBJECTS.has(entity)
        const ok = isSingle
          ? data && typeof data === 'object' && !Array.isArray(data)
          : Array.isArray(data)
        if (ok) {
          result[entity] = data
          if (sha) shaMap[entity] = sha
        }
      } catch (e) {
        // 云端尚无该文件（404）→ 忽略，后续写入会自动创建
      }
    })
  )

  shaCache = { ...shaMap }
  return { result, shaMap }
}

/**
 * 推送单个实体到 GitHub。写失败（sha 冲突 409/422）时自动重拉最新 sha 重试一次。
 * @returns {Promise<boolean>} 是否成功
 */
export async function pushEntity(entity, records) {
  const token = getGithubToken()
  if (!token) return false
  const file = SYNC_COLLECTIONS[entity]
  if (!file) return false

  const writeOnce = async (sha) => {
    const { sha: newSha } = await writeJson(
      REPO_DATA,
      file,
      records,
      token,
      `sync ${entity} @ ${new Date().toISOString().slice(0, 19)}`,
      sha,
    )
    return newSha
  }

  try {
    const newSha = await writeOnce(shaCache[entity])
    if (newSha) shaCache[entity] = newSha
    return true
  } catch (e) {
    const msg = String(e.message || '')
    if (msg.includes('409') || msg.includes('422')) {
      try {
        const { sha } = await readJson(REPO_DATA, file, token)
        const newSha = await writeOnce(sha)
        if (newSha) shaCache[entity] = newSha
        return true
      } catch (e2) {
        console.warn('[sync] retry failed', entity, e2)
        shaCache[entity] = null
        return false
      }
    }
    console.warn('[sync] push failed', entity, e)
    shaCache[entity] = null
    return false
  }
}

/**
 * 全量回灌：把所有同步实体一次性推送到云端。
 *
 * 用途：本地已有历史数据（云端缺失或从未同步过的实体）时，变更订阅不会触发推送，
 * 必须手动全量推一次，否则换设备仍然拿不到这些记录。
 * @param {(entity:string)=>unknown} getRecords 取某个实体当前值的回调
 * @returns {Promise<{ok:boolean, pushed:string[], failed:string[]}>}
 */
export async function pushAll(getRecords) {
  const token = getGithubToken()
  if (!token) return { ok: false, pushed: [], failed: [] }
  const pushed = []
  const failed = []
  await Promise.all(
    Object.keys(SYNC_COLLECTIONS).map(async (entity) => {
      const records = getRecords(entity)
      if (records === undefined || records === null) return
      const ok = await pushEntity(entity, records)
      ok ? pushed.push(entity) : failed.push(entity)
    })
  )
  return { ok: failed.length === 0, pushed, failed }
}
