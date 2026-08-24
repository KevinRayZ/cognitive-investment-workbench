/**
 * 在线同步层 —— 纯前端把 store 中的运行数据读写到 GitHub 私有仓库 investment-data。
 * 启动时 pullAll() 拉取云端数据 hydrate；写操作后 pushEntity() 防抖推送。
 * 带 sha 缓存与冲突重试（跨设备同时改动时自动重拉最新 sha 再写）。
 */
import { getGithubToken } from './credentials'
import { readJson, writeJson, REPO_DATA } from './githubClient'

// 本地 store 实体 → 云端集合文件 映射
export const SYNC_COLLECTIONS = {
  trades: 'trades.json',
  reviews: 'reviews.json',
  reflections: 'reflections.json',
  positions: 'positions.json',
  conversations: 'conversations.json',
  dashboard: 'dashboard.json',
}

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
  for (const [entity, file] of Object.entries(SYNC_COLLECTIONS)) {
    const { data, sha } = await readJson(REPO_DATA, file, token)
    if (Array.isArray(data)) {
      result[entity] = data
      shaMap[entity] = sha
    }
  }
  // dashboard 为单一对象（非数组集合），单独拉取
  try {
    const { data: dash, sha: dashSha } = await readJson(REPO_DATA, 'dashboard.json', token)
    if (dash && typeof dash === 'object' && !Array.isArray(dash)) {
      result.dashboard = dash
      shaMap.dashboard = dashSha
    }
  } catch (e) {
    // 云端尚无 dashboard.json 时忽略
  }
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
