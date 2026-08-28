/**
 * 圈子数据源适配层 —— 环球青藤「张湧的小密圈」帖子接入。
 *
 * 数据流：japi.hqwx.com 圈子开放接口（鉴权走 URL 参数 edu24ol_token/passport，
 * 凭证存本机 localStorage，与 GitHub Token / DeepSeek Key 同级管理）。
 * 已验证该接口 CORS 动态放行任意 Origin，纯前端可直接调用，无需代理。
 *
 * 标签映射（circleId=259211，goodsId=191593）：
 *   2189 市场动态分析（每日盘中/盘后分析）
 *   2192 市场分析直播（每月直播预告与主题）
 *   2194 湧哥早课 / 2190 投研信息 / 2393 湧哥洞见手记 / 1000 精华 / 1001 最新
 */
import { useState, useEffect, useCallback } from 'react'
import { getCircleToken } from './credentials'

export const CIRCLE = {
  base: 'https://japi.hqwx.com/circle/v1/detail/articleList',
  circleId: 259211,
  goodsId: 191593,
  pageUrl: 'https://user.hqqt.com/v2/group/list/76083590/191593/259211',
  tags: {
    daily: 2189, // 市场动态分析（每日）
    monthlyLive: 2192, // 市场分析直播（每月）
    morning: 2194, // 湧哥早课
    investInfo: 2190, // 投研信息
    insight: 2393, // 湧哥洞见手记
    featured: 1000, // 精华
    latest: 1001, // 最新
  },
}

const CACHE_PREFIX = 'ciw_circle_cache_'
const CACHE_TTL = 10 * 60 * 1000 // 10 分钟内存级缓存

/** 通用参数（与官网页面请求保持一致）。 */
function baseParams() {
  return '_appid=wwwhqqt&appid=wwwhqqt&_org_id=2&org_id=2&_os=3&os=3&_v=1.0.0&v=1.0.0&schId=2&pschId=14&platform=web'
}

/**
 * 拉取圈子标签下的帖子列表。
 * @param {number} tagId 标签 id（见 CIRCLE.tags）
 * @param {{rows?: number, from?: number, force?: boolean}} opts
 * @returns {Promise<Array<{id:number,date:string,ts:number,author:string,role:string,content:string,views:number,likes:number,audio:string[]}>>}
 */
export async function fetchCircleArticles(tagId, { rows = 10, from = 0, force = false } = {}) {
  const cacheKey = `${CACHE_PREFIX}${tagId}_${from}_${rows}`
  if (!force) {
    try {
      const hit = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
      if (hit && Date.now() - hit.t < CACHE_TTL) return hit.data
    } catch {}
  }

  const token = getCircleToken()
  if (!token) throw new Error('MISSING_TOKEN')

  const url =
    `${CIRCLE.base}?${baseParams()}&circleId=${CIRCLE.circleId}` +
    `&tagId=${tagId}&from=${from}&rows=${rows}` +
    `&edu24ol_token=${encodeURIComponent(token)}&passport=${encodeURIComponent(token)}` +
    `&_t=${Date.now()}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`圈子接口 HTTP ${res.status}`)
  const json = await res.json()
  if (json.status?.code !== 0) throw new Error(json.status?.msg || '圈子接口返回异常')
  // token 失效时接口可能返回空数据或错误码，这里统一提示
  const list = Array.isArray(json.data) ? json.data : []
  if (!list.length) throw new Error('EMPTY')

  const items = list.map((a) => ({
    id: a.id,
    ts: a.publishDate || 0,
    date: a.publishDate ? new Date(a.publishDate).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '',
    author: a.publisher?.nickName || '—',
    role: a.publisher?.role === 1 ? '主理人' : a.publisher?.role === 2 ? '管理员' : a.publisher?.role === 3 ? '嘉宾' : '学员',
    content: (a.pureContent || '').replace(/^#\S+\s*/, '').trim(),
    views: a.viewNum || 0,
    likes: a.pointNum || 0,
    audio: (a.audioList || []).map((f) => f.fileName || f.name || '').filter(Boolean),
  }))

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data: items }))
  } catch {}
  return items
}

/**
 * React Hook：加载某标签帖子流（自动读取凭证，带缓存与手动刷新）。
 */
export function useCircleArticles(tagId, rows = 8) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (force = false) => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchCircleArticles(tagId, { rows, force })
        setItems(data)
      } catch (e) {
        const msg = e.message || String(e)
        setError(msg === 'MISSING_TOKEN' ? 'MISSING_TOKEN' : msg === 'EMPTY' ? '接口返回为空（凭证可能已失效，请到设置页更新圈子凭证）' : msg)
      } finally {
        setLoading(false)
      }
    },
    [tagId, rows]
  )

  useEffect(() => {
    load(false)
  }, [load])

  return { items, loading, error, reload: () => load(true) }
}

/** 取正文首行作为摘要（标题行）。 */
export function firstLine(text) {
  return ((text || '').split('\n').map((s) => s.trim()).find(Boolean) || '').slice(0, 60)
}
