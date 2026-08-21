import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowForward from '@mui/icons-material/ArrowForward'
import ArrowBack from '@mui/icons-material/ArrowBack'

import tokens from '../theme/tokens'

const HUMAN = ['目标设定', '感知读资料', '分析对话', '决策', '执行', '复盘写回']
const AI = ['读取记忆', '生成建议', '标注来源', '等待确认', '回灌记忆']

function StepColumn({ title, steps, color, soft }) {
  return (
    <Box sx={{ width: 180, flexShrink: 0 }}>
      <Box sx={{ textAlign: 'center', mb: 1, fontWeight: 700, color, fontSize: 13.5 }}>{title}</Box>
      <Stack spacing={0.75}>
        {steps.map((s, i) => (
          <Box key={i} sx={{ px: 1, py: 0.75, borderRadius: 1.5, bgcolor: soft, color, fontSize: 12.5, fontWeight: 600, textAlign: 'center' }}>
            {s}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function LayerCard({ label, sub, color }) {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1.5, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderLeft: `3px solid ${color}`, textAlign: 'center' }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900 }}>{label}</Typography>
      <Typography sx={{ fontSize: 11, color: tokens.ink500 }}>{sub}</Typography>
    </Box>
  )
}

/**
 * 双环回灌关系图（人类环 ↔ 三层记忆 ↔ AI 环）。
 * 纯 Box 布局实现，避免 SVG 解析风险；展示「人类写入 · AI 读取」双向箭头与回灌规则。
 */
export default function DualLoopDiagram() {
  return (
    <Box sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        <StepColumn title="人类环（6 步）" steps={HUMAN} color={tokens.primary} soft={tokens.primarySoft} />

        {/* 中间：双向箭头 + 三层记忆 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 150 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tokens.ink500, fontSize: 11 }}>
            <ArrowBack sx={{ fontSize: 14, color: tokens.primary }} /> 人类写入
          </Box>
          <Stack spacing={0.75} sx={{ width: '100%' }}>
            <LayerCard label="L1 核心原则" sub="长期记忆·宪法级" color={tokens.primary} />
            <LayerCard label="L2 体系版本" sub="对话上下文" color={tokens.warn} />
            <LayerCard label="L3 学习档案" sub="资料库·在线" color={tokens.ai} />
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tokens.ink500, fontSize: 11 }}>
            AI 读取 <ArrowForward sx={{ fontSize: 14, color: tokens.ai }} /> 
          </Box>
        </Box>

        <StepColumn title="AI 环（5 步）" steps={AI} color={tokens.ai} soft={tokens.aiSoft} />
      </Box>

      <Box sx={{ mt: 2, p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}`, fontSize: 12.5, color: tokens.ink500, textAlign: 'center' }}>
        回灌规则：AI 建议经人工确认后写回对应层；AI 环不得跨过「执行 / 交易」环节。人类环与 AI 环通过三层记忆衔接，形成双向认知进化闭环。
      </Box>
    </Box>
  )
}
