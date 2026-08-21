/**
 * GitHub 数据层 —— 读写私有仓库（投资体系知识库 + 投资运行数据）。
 * 基于 REST Contents API，每次写入 = 一次 commit（git 版本管理天然成立）。
 * Token 来源：优先环境变量 GITHUB_TOKEN，回退到 gh CLI 已登录凭证。
 */
import { execSync } from 'node:child_process'

const OWNER = 'KevinRayZ'
export const REPO_KNOWLEDGE = 'investment-system' // 体系知识库（system.json + docs）
export const REPO_DATA = 'investment-data' // 运行数据（trades/reviews/reflections/positions/conversations）

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  try {
    // 回退：gh CLI 已登录（KevinRayZ）
    return execSync('gh auth token', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error('缺少 GitHub Token：请设置环境变量 GITHUB_TOKEN 或先 gh auth login')
  }
}

const HEADERS = () => ({
  Authorization: `Bearer ${getToken()}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

/** 读取仓库内文本文件（path 如 "system.json" / "trades.json"）。不存在返回 null。 */
export async function readFile(repo, path) {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`
  const res = await fetch(url, { headers: HEADERS() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub read ${path} failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  }
}

/** 读取并解析 JSON 文件，返回 { data, sha }；文件不存在返回 { data: null, sha: null }。 */
export async function readJson(repo, path) {
  const file = await readFile(repo, path)
  if (!file) return { data: null, sha: null }
  try {
    return { data: JSON.parse(file.content), sha: file.sha }
  } catch {
    return { data: null, sha: file.sha }
  }
}

/** 写入文本文件（自动 commit + push）。message 为 commit 说明。 */
export async function writeFile(repo, path, content, message) {
  const existing = await readFile(repo, path)
  const body = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    ...(existing ? { sha: existing.sha } : {}),
  }
  const url = `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub write ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

/** 写入 JSON 文件（序列化后写）。 */
export async function writeJson(repo, path, data, message) {
  return writeFile(repo, path, JSON.stringify(data, null, 2) + '\n', message)
}

/** 追加记录到 JSON 数组集合（自动 commit）。返回更新后的数组。 */
export async function appendRecord(repo, path, record, message) {
  const { data, sha } = await readJson(repo, path)
  const list = Array.isArray(data) ? data : []
  list.push(record)
  await writeFile(repo, path, JSON.stringify(list, null, 2) + '\n', message)
  return list
}
