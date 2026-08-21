import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import FileSearch from '@mui/icons-material/FindInPage'
import Web from '@mui/icons-material/Hub'
import Search from '@mui/icons-material/Search'
import Analytics from '@mui/icons-material/Insights'
import Robot from '@mui/icons-material/SmartToyOutlined'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'

const STAGES = [
  { icon: FileSearch, title: '输入阶段 · 信息分拣工', desc: '拆解学习资料：研报/长文速读提炼核心逻辑、看点、风险、关键数据，分点 ≤ 300 字；碎片结构化。' },
  { icon: Web, title: '关联阶段 · 知识织网工', desc: '校验体系逻辑、排查策略冲突；新内容入库时关联现有体系，每月梳理框架矛盾与空白。' },
  { icon: Search, title: '调用阶段 · 智能检索员', desc: '自然语言提问精准提取；决策校验（标的是否符合总纲原则与能力圈边界）。' },
  { icon: Analytics, title: '迭代阶段 · 复盘分析师', desc: '沉淀认知增量、输出迭代优化建议、辅助跟踪宏观周期与大类资产性价比；月度汇总最常犯 3 错误 + 优化建议。' },
]

const FRAMEWORK = ['哲学', '能力圈', '分析', '交易', '风控', '复盘']
const FOUR_Q = [
  '作者核心观点是什么？',
  '观点的前提假设是什么？',
  '若采纳，需修改体系的哪个部分？',
  '有无与现有体系冲突的地方？',
]

const CRYSTALLIZE = [
  { t: '冲突检测', d: '替换 / 并存 / 放弃' },
  { t: '依赖梳理', d: '需补什么能力 / 资料' },
  { t: '版本快照', d: '写一条体系变更日志，并在 GitHub 更新版本' },
]

/**
 * AI 协作协议面板（系统治理）—— 固化行为契约，仅展示，未来可扩展为 Agent 配置入口。
 */
export default function AiProtocol() {
  return (
    <Box>
      <PageHeader
        breadcrumb="记忆与体系"
        title="AI 协作协议"
        subtitle="四阶段能力 · 六维解构框架 · 知识晶体化流程（行为契约，固化实现）"
        status={
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 0, bgcolor: tokens.aiSoft }}>
            <Robot sx={{ fontSize: 15, color: tokens.ai }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>AI 辅助 · 不越权</Typography>
          </Box>
        }
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 四阶段 */}
        <Section title="四阶段能力">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {STAGES.map((s) => {
              const Icon = s.icon
              return (
                <Box key={s.title} sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: tokens.aiSoft, color: tokens.ai, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 14.5 }}>{s.title}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: tokens.ink500, lineHeight: 1.6 }}>{s.desc}</Typography>
                </Box>
              )
            })}
          </Box>
        </Section>

        {/* 六维解构框架 */}
        <Section title="学习资料解构框架（每次讨论用）">
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {FRAMEWORK.map((f) => (
              <Box key={f} sx={{ px: 2, py: 1, borderRadius: 0, bgcolor: tokens.primarySoft, color: tokens.primary, fontWeight: 600, fontSize: 13.5 }}>{f}</Box>
            ))}
          </Stack>
          <Box sx={{ mt: 1.5, p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}` }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900, mb: 0.75 }}>四问</Typography>
            <Stack spacing={0.5}>
              {FOUR_Q.map((q, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, fontSize: 13.5, color: tokens.ink700 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: 1, bgcolor: tokens.primary, mt: 1, flexShrink: 0 }} /> {q}
                </Box>
              ))}
            </Stack>
          </Box>
        </Section>

        {/* 知识晶体化 */}
        <Section title="知识晶体化（讨论尾声执行）">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {CRYSTALLIZE.map((c, i) => (
              <Box key={c.t} sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderTop: `3px solid ${tokens.ai}` }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: tokens.ink900, mb: 0.25 }}>{i + 1}. {c.t}</Typography>
                <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>{c.d}</Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink400, mt: 1 }}>
            流程：生成原则卡片（IS 格式）存入「原则卡片」表 → 冲突检测 / 依赖梳理 / 版本快照（写一条变更日志）→ 版本在 GitHub 更新。
          </Typography>
        </Section>
      </Box>
    </Box>
  )
}

function Section({ title, children }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  )
}
