import { useState, useRef, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Send from '@mui/icons-material/Send'
import SmartToy from '@mui/icons-material/SmartToy'
import Person from '@mui/icons-material/Person'
import CheckCircle from '@mui/icons-material/CheckCircleOutline'
import WarningAmber from '@mui/icons-material/WarningAmber'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import { useStore } from '../store/useStore'
import { chatCompletion } from '../lib/deepseek'
import { getKnowledge, buildSystemPrompt } from '../lib/knowledge'
import { buildExtractMessages, parseExtractJson } from '../lib/extract'
import { readJson, writeJson, REPO_DATA, REPO_KNOWLEDGE } from '../lib/githubClient'
import { getGithubToken, getDeepseekKey } from '../lib/credentials'

const INTENT_META = {
  knowledge: { label: '体系知识已固化', tone: 'primary' },
  trade: { label: '交易已记录', tone: 'up' },
  review: { label: '复盘已记录', tone: 'warn' },
  reflection: { label: '感想已沉淀', tone: 'ai' },
  position: { label: '持仓已更新', tone: 'down' },
  nothing: { label: '无新内容固化', tone: 'neutral' },
}

const STARTERS = [
  '帮我分析一只标的是否符合我的体系',
  '记录一笔交易：买入蜜雪集团 1000 股 @148',
  '复盘一下我最近的操作',
  '这条信息对我的体系有什么启发',
]

/**
 * AI 对话（入口 A）—— 浏览器直连 DeepSeek 大脑（密钥存于本机浏览器），
 * 对话后自动结构化固化：交易/复盘写入在线数据库，新认知追加到体系知识库。
 * 与 WorkBuddy 对话（入口 B）共享同一 GitHub 数据源，效果一致。
 */
export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastIntent, setLastIntent] = useState(null)
  const [confirm, setConfirm] = useState(null) // 敏感知识确认 { summary, data }
  const [err, setErr] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const todayStr = () => new Date().toISOString().slice(0, 10)

  // 向 investment-data 仓库的某个集合文件追加一条记录（读-改-写，带 sha）
  const appendToData = async (file, record) => {
    const token = getGithubToken()
    const { data, sha } = await readJson(REPO_DATA, file, token)
    const list = Array.isArray(data) ? data : []
    list.push(record)
    await writeJson(REPO_DATA, file, list, token, `add ${file}`, sha)
  }

  // 结构化结果路由落库
  const routeExtract = async (ext) => {
    const d = ext.data || {}
    const date = d.date || todayStr()
    let updated = []
    const pending = ext.intent === 'knowledge' ? { summary: d.reason || d.title || '体系知识更新', data: d } : null
    switch (ext.intent) {
      case 'trade':
        useStore.getState().create('trades', { ...d, date })
        updated = ['trades']
        break
      case 'review':
        useStore.getState().create('reviews', { ...d, type: '复盘', date })
        updated = ['reviews']
        break
      case 'reflection':
        await appendToData('reflections.json', { ...d, date, addedAt: new Date().toISOString() })
        updated = ['reflections']
        break
      case 'position':
        await appendToData('positions.json', { ...d, date })
        updated = ['positions']
        break
      default:
        break
    }
    setLastIntent({ intent: ext.intent, confidence: ext.confidence || 0, updated })
    if (pending) setConfirm(pending)
  }

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    if (!getDeepseekKey()) {
      setErr('未配置 DeepSeek Key：请先到「设置」页填写 DEEPSEEK_API_KEY')
      return
    }
    setInput('')
    setErr('')
    setLastIntent(null)
    const history = [...messages, { role: 'user', content: q }]
    setMessages(history)
    setLoading(true)
    try {
      // 1) 拉取体系知识 → 构建 system prompt → 调用 DeepSeek 生成回复
      const k = await getKnowledge()
      const chatMessages = [
        { role: 'system', content: buildSystemPrompt(k) },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ]
      const reply = await chatCompletion(chatMessages)
      setMessages([...history, { role: 'assistant', content: reply }])

      // 2) 结构化提取（第二次低温度调用，判定 intent），命中则落库
      if (getGithubToken()) {
        const extractRaw = await chatCompletion(buildExtractMessages(history, reply), {
          temperature: 0.2,
          maxTokens: 800,
        })
        const ext = parseExtractJson(extractRaw)
        if (ext && ext.intent && ext.intent !== 'nothing') {
          await routeExtract(ext)
        } else {
          setLastIntent({ intent: 'nothing', confidence: ext?.confidence || 0, updated: [] })
        }
      }
    } catch (e) {
      setErr(e.message)
      setMessages(history)
    } finally {
      setLoading(false)
    }
  }

  const confirmKnowledge = async (approve) => {
    if (approve && confirm) {
      try {
        const token = getGithubToken()
        const d = confirm.data || {}
        const entry = {
          id: 'ADD-' + Date.now(),
          title: d.title || '新认知',
          content: d.content || '',
          reason: d.reason || '',
          target: d.target || '',
          addedAt: new Date().toISOString(),
        }
        const { data, sha } = await readJson(REPO_KNOWLEDGE, 'system.json', token)
        const sys = data || {}
        sys.additions = Array.isArray(sys.additions) ? sys.additions : []
        sys.additions.push(entry)
        await writeJson(REPO_KNOWLEDGE, 'system.json', sys, token, `add knowledge: ${entry.title}`, sha)
        setLastIntent({ intent: 'knowledge', confidence: 1, updated: ['knowledge'] })
      } catch (e) {
        setErr(e.message)
      }
    }
    setConfirm(null)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        breadcrumb="核心工作台"
        title="AI 对话"
        subtitle="认知投资搭档 · 入口 A（与 WorkBuddy 对话共享同一在线数据源）"
        status={
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 0, bgcolor: tokens.aiSoft }}>
            <SmartToy sx={{ fontSize: 15, color: tokens.ai }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>DeepSeek 大脑 · 体系约束</Typography>
          </Box>
        }
      />

      {/* 消息区 */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: tokens.bgPage }}>
        {messages.length === 0 && (
          <Stack spacing={1.5} sx={{ mx: 'auto', width: '100%', maxWidth: 640, pt: 4 }}>
            <Typography sx={{ fontSize: 14, color: tokens.ink700, textAlign: 'center', mb: 1 }}>
              和你的认知投资搭档聊聊 —— 新认知自动固化到体系知识库，新交易/感想自动写入在线数据库。
            </Typography>
            {STARTERS.map((s) => (
              <Button key={s} variant="outlined" onClick={() => send(s)} sx={{ textTransform: 'none', justifyContent: 'flex-start', color: tokens.ink500, borderColor: tokens.border, borderRadius: 1 }}>
                {s}
              </Button>
            ))}
          </Stack>
        )}

        {messages.map((m, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <Box
              sx={{
                maxWidth: '72%',
                p: 1.75,
                borderRadius: 1,
                bgcolor: m.role === 'user' ? tokens.primary : tokens.surface,
                color: m.role === 'user' ? '#fff' : tokens.ink700,
                border: m.role === 'user' ? 'none' : `1px solid ${tokens.border}`,
                whiteSpace: 'pre-wrap',
                fontSize: 13.5,
                lineHeight: 1.7,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, color: m.role === 'user' ? 'rgba(255,255,255,.9)' : tokens.ink400, fontSize: 11, fontWeight: 600 }}>
                {m.role === 'user' ? <Person sx={{ fontSize: 14 }} /> : <SmartToy sx={{ fontSize: 14, color: tokens.ai }} />}
                {m.role === 'user' ? '你' : 'AI 认知搭档'}
              </Box>
              {m.content}
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: tokens.ink400, fontSize: 13 }}>
            <CircularProgress size={16} sx={{ color: tokens.ai }} /> AI 思考中…
          </Box>
        )}

        {lastIntent && !loading && (
          <Box sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusPill label={INTENT_META[lastIntent.intent]?.label || '已处理'} tone={INTENT_META[lastIntent.intent]?.tone || 'neutral'} />
            {lastIntent.intent !== 'nothing' && (
              <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>
                已同步至在线数据库（confidence {Math.round((lastIntent.confidence || 0) * 100)}%）
              </Typography>
            )}
          </Box>
        )}

        {err && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 1, bgcolor: tokens.warnSoft, color: '#9A6700', fontSize: 13 }}>
            <WarningAmber sx={{ fontSize: 16 }} /> {err}
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      {/* 输入区 */}
      <Box sx={{ p: 2, bgcolor: tokens.surface, borderTop: `1px solid ${tokens.border}` }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="输入你想探讨的话题、记录交易或复盘…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
          <Button variant="contained" onClick={() => send()} disabled={loading || !input.trim()} sx={{ borderRadius: 1, px: 2.5 }}>
            <Send sx={{ fontSize: 17 }} />
          </Button>
        </Box>
        <Typography sx={{ fontSize: 11, color: tokens.ink400, mt: 1 }}>
          AI 可给出方向与仓位建议（建议级），但无自动执行权；所有买卖决策由你做出，体系底层信念与核心风控的修改需经你确认后才生效。
        </Typography>
      </Box>

      {/* 敏感知识确认 */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 16 }}>
          <WarningAmber sx={{ color: tokens.warn }} /> 体系知识更新需你确认
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: tokens.ink700, mb: 1.5 }}>{confirm?.summary}</Typography>
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}`, fontSize: 13, color: tokens.ink700, whiteSpace: 'pre-wrap' }}>
            {confirm?.data?.content}
          </Box>
          <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 1.5 }}>
            涉及底层信念或核心风控规则，按《个人投资体系总纲》§11.3 须你确认后才会写入知识库。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => confirmKnowledge(false)} sx={{ color: tokens.ink500, borderRadius: 1 }}>放弃</Button>
          <Button variant="contained" onClick={() => confirmKnowledge(true)} sx={{ borderRadius: 1 }}>
            <CheckCircle sx={{ fontSize: 17, mr: 0.5 }} /> 确认写入
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
