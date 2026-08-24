/**
 * 前端版 GitHub Contents API 封装（纯浏览器，无后端）。
 * 数据层读写用户的私有仓库：investment-data（运行数据）/ investment-system（知识库）。
 * 每次写入 = 一次 commit，git 版本管理天然成立，跨设备不损失信息。
 *
 * 注意：所有函数都需要调用方传入 token（来自 credentials.getGithubToken()）。
 * 浏览器直连 api.github.com 的 CORS 已验证允许（Access-Control-Allow-Origin: *）。
 */

const OWNER = 'KevinRayZ'
export const REPO_KNOWLEDGE = 'investment-system' // 体系知识库（system.json + docs）
export const REPO_DATA = 'investment-data' // 运行数据（trades/reviews/...）

const HEADERS = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...extra,
})

/** 读取仓库内文本文件（path 如 "system.json" / "trades.json"）。不存在返回 null。 */
export async function readFile(repo, path, token) {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`
  const res = await fetch(url, { headers: HEADERS(token) })
  if (res.status === 404) return null
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`GitHub 读取 ${path} 失败：${res.status} ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  return { content: decodeBase64(data.content), sha: data.sha }
}

/** 读取并解析 JSON 文件，返回 { data, sha }；文件不存在返回 { data: null, sha: null }。 */
export async function readJson(repo, path, token) {
  const file = await readFile(repo, path, token)
  if (!file) return { data: null, sha: null }
  try {
    return { data: JSON.parse(file.content), sha: file.sha }
  } catch {
    return { data: null, sha: file.sha }
  }
}

/** 写入文本文件（一次 commit）。sha 提供则更新，不提供则创建。 */
export async function writeFile(repo, path, content, token, message, sha) {
  const body = { message: message || `update ${path}`, content: encodeBase64(content) }
  if (sha) body.sha = sha
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`GitHub 写入 ${path} 失败：${res.status} ${t.slice(0, 200)}`)
  }
  const json = await res.json()
  return { sha: json.content?.sha }
}

/** 写入 JSON 文件（序列化后写）。 */
export async function writeJson(repo, path, data, token, message, sha) {
  return writeFile(repo, path, JSON.stringify(data, null, 2) + '\n', token, message, sha)
}

// ===== base64（兼容中文 / UTF-8） =====
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}
function decodeBase64(b64) {
  const bin = atob((b64 || '').replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
