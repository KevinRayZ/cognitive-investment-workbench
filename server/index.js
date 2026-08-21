/**
 * 认知投资工作台 · 本地后端（v2.0.0 在线化）
 * - 数据层：GitHub 私有仓库读写（investment-system 知识库 / investment-data 运行数据）
 * - 大脑：DeepSeek API（OpenAI 兼容）
 * - 闭环：对话 → 结构化判定 → 自动写入 / 敏感确认 → 双入口数据一致
 */
import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import {
  readJson,
  writeJson,
  appendRecord,
  REPO_DATA,
  REPO_KNOWLEDGE,
} from './github.js'
import { chatCompletion, lastUserText } from './deepseek.js'
import { buildExtractMessages, parseExtractJson } from './extract.js'
import { getKnowledge, buildSystemPrompt } from './knowledge.js'

const app = express()
const PORT = process.env.PORT || 8787
const DATA_COLLECTIONS = ['trades', 'reviews', 'reflections', 'positions', 'conversations']

app.use(cors())
app.use(express.json({ limit: '2mb' }))

/** 记录一条对话固化流水（conversations.json），无新内容不记录。 */
async function logConversation(payload) {
  try {
    await appendRecord(REPO_DATA, 'conversations.json', {
      id: randomUUID(),
      at: new Date().toISOString().slice(0, 10),
      intent: payload.intent,
      summary: payload.summary || '',
      source: 'workbench', // 入口A
      messages: payload.messages?.slice(-4) || [],
    }, `conv: ${payload.intent} ${new Date().toISOString().slice(0, 10)}`)
  } catch {
    /* 对话记录失败不阻断主流程 */
  }
}

// ---------- 健康检查 ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, version: '2.0.0', time: new Date().toISOString() }))

// ---------- 知识库：拉取体系 ----------
app.get('/api/knowledge', async (_req, res) => {
  try {
    const k = await getKnowledge()
    res.json({ ok: true, data: k })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---------- 运行数据：读取全部集合 ----------
app.get('/api/data', async (_req, res) => {
  try {
    const out = {}
    for (const c of DATA_COLLECTIONS) {
      const { data } = await readJson(REPO_DATA, `${c}.json`)
      out[c] = Array.isArray(data) ? data : []
    }
    res.json({ ok: true, data: out })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---------- 运行数据：追加记录（表单直写 / 入口B 转写） ----------
app.post('/api/data/:collection', async (req, res) => {
  const { collection } = req.params
  if (!DATA_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ ok: false, error: `collection 必须是 ${DATA_COLLECTIONS.join('/')}` })
  }
  const record = req.body?.record
  if (!record) return res.status(400).json({ ok: false, error: '缺少 record' })
  try {
    const enriched = {
      id: randomUUID(),
      createdAt: new Date().toISOString().slice(0, 10),
      source: record.source || 'workbench',
      ...record,
    }
    await appendRecord(REPO_DATA, `${collection}.json`, enriched, `add ${collection}: ${enriched.target || enriched.title || enriched.id}`)
    res.json({ ok: true, record: enriched })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---------- 运行数据：全量覆盖集合（前端本地改完整体同步） ----------
app.put('/api/data/:collection', async (req, res) => {
  const { collection } = req.params
  if (!DATA_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ ok: false, error: `collection 必须是 ${DATA_COLLECTIONS.join('/')}` })
  }
  const list = req.body?.data
  if (!Array.isArray(list)) return res.status(400).json({ ok: false, error: 'data 必须是数组' })
  try {
    await writeJson(REPO_DATA, `${collection}.json`, list, `sync ${collection}: ${list.length} 条`)
    res.json({ ok: true, count: list.length })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---------- 核心闭环：对话 → 结构化 → 落库 ----------
app.post('/api/chat', async (req, res) => {
  const messages = req.body?.messages
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ ok: false, error: '缺少 messages' })
  }
  try {
    // 1) 拉取知识库 → 构建 system prompt
    const knowledge = await getKnowledge()
    const systemPrompt = buildSystemPrompt(knowledge)
    const chatMessages = [{ role: 'system', content: systemPrompt }, ...messages]

    // 2) AI 自然回复
    const reply = await chatCompletion(chatMessages)

    // 3) 结构化判定（同一次模型，冷启动快）
    const extractMessages = buildExtractMessages(messages, reply)
    const rawExtract = await chatCompletion(extractMessages, { temperature: 0.1, maxTokens: 1024 })
    const parsed = parseExtractJson(rawExtract) || { intent: 'nothing', confidence: 0, requiresHumanConfirm: false, data: {} }
    const { intent, confidence, requiresHumanConfirm, data } = parsed

    // 4) 分流落库
    let updated = []
    let pendingConfirm = null

    if (intent === 'trade' && data?.target) {
      await appendRecord(REPO_DATA, 'trades.json', { ...data, id: randomUUID(), createdAt: new Date().toISOString().slice(0, 10), source: 'workbench' }, `trade: ${data.target} ${data.direction || ''}`)
      updated.push('trades')
    } else if (intent === 'review' && data?.content) {
      await appendRecord(REPO_DATA, 'reviews.json', { ...data, id: randomUUID(), createdAt: new Date().toISOString().slice(0, 10), source: 'workbench' }, `review: ${data.title || '复盘'}`)
      updated.push('reviews')
    } else if (intent === 'reflection' && data?.content) {
      await appendRecord(REPO_DATA, 'reflections.json', { ...data, id: randomUUID(), createdAt: new Date().toISOString().slice(0, 10), source: 'workbench' }, `reflection: ${data.title || '感想'}`)
      updated.push('reflections')
    } else if (intent === 'position' && data?.target) {
      await appendRecord(REPO_DATA, 'positions.json', { ...data, id: randomUUID(), createdAt: new Date().toISOString().slice(0, 10), source: 'workbench' }, `position: ${data.target}`)
      updated.push('positions')
    } else if (intent === 'knowledge' && data?.content) {
      if (requiresHumanConfirm) {
        pendingConfirm = { intent, data, summary: `${data.type === 'new' ? '新增' : '修改'}体系规则：${data.title || ''}` }
      } else {
        // 非敏感知识：写入知识库 system.json 的对应模块（简化：append 到对应数组）
        await writeKnowledgeRecord(data)
        updated.push('knowledge')
      }
    }

    // 5) 对话固化流水（仅当有新内容）
    if (updated.length || pendingConfirm) {
      await logConversation({ intent, summary: pendingConfirm?.summary || updated.join(','), messages })
    }

    res.json({
      ok: true,
      reply,
      extract: { intent, confidence, requiresHumanConfirm },
      updated,
      pendingConfirm,
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---------- 敏感知识确认后写入 ----------
app.post('/api/knowledge/confirm', async (req, res) => {
  const { data } = req.body || {}
  if (!data?.content) return res.status(400).json({ ok: false, error: '缺少 data' })
  try {
    await writeKnowledgeRecord(data)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

/** 将知识记录写入知识库 system.json（简化实现：追加/更新 beliefs 或 strategies）。 */
async function writeKnowledgeRecord(data) {
  const { data: sys, sha } = await readJson(REPO_KNOWLEDGE, 'system.json')
  if (!sys) throw new Error('知识库 system.json 不存在')
  const target = data.target // 'beliefs' | 'strategies' | ...
  const arr = Array.isArray(sys[target]) ? sys[target] : []
  if (data.type === 'new') {
    const nextId = `${target === 'beliefs' ? 'B' : target === 'strategies' ? 'S' : 'K'}-${String(arr.length + 1).padStart(2, '0')}`
    arr.push({ id: nextId, title: data.title, statement: data.content, note: data.reason || '', updatedAt: new Date().toISOString().slice(0, 10) })
  } else {
    const idx = arr.findIndex((x) => x.title === data.title)
    if (idx >= 0) arr[idx] = { ...arr[idx], statement: data.content, note: data.reason || '', updatedAt: new Date().toISOString().slice(0, 10) }
    else arr.push({ id: `K-${String(arr.length + 1).padStart(2, '0')}`, title: data.title, statement: data.content, note: data.reason || '', updatedAt: new Date().toISOString().slice(0, 10) })
  }
  sys[target] = arr
  await writeJson(REPO_KNOWLEDGE, 'system.json', sys, `knowledge: ${data.type === 'new' ? '新增' : '更新'} ${data.title}`)
}

app.listen(PORT, () => {
  console.log(`[认知投资工作台后端] http://localhost:${PORT}`)
  console.log(`数据仓库: ${REPO_DATA} / ${REPO_KNOWLEDGE}`)
})
