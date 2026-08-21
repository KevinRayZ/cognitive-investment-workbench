import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Sync from '@mui/icons-material/Sync'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import MemoryLayerCard from '../components/MemoryLayerCard'
import DualLoopDiagram from '../components/DualLoopDiagram'

/**
 * 三层记忆总览（L1 / L2 / L3）+ 双环回灌关系图。
 */
export default function MemoryLayers() {
  const layers = useStore((s) => s.getMemoryLayers())
  const version = useStore((s) => s.version)

  return (
    <Box>
      <PageHeader
        breadcrumb="记忆与体系"
        title="三层记忆总览"
        subtitle="L1 核心原则 · L2 体系版本 · L3 学习档案 的总览与双环回灌"
        status={<Stack direction="row" spacing={1}><span /></Stack>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* AI 同步条 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}` }}>
          <Sync sx={{ fontSize: 18, color: tokens.ai }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.ai }}>AI 记忆同步</Typography>
          <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>
            L1 已固化 · L2 {version || 'v1.0'} · L3 学习中
          </Typography>
        </Box>

        {/* 三张层卡 */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <MemoryLayerCard title={layers.l1.title} metrics={layers.l1.metrics} tone="primary" />
          <MemoryLayerCard title={layers.l2.title} metrics={layers.l2.metrics} tone="warn" />
          <MemoryLayerCard title={layers.l3.title} metrics={layers.l3.metrics} tone="ai" />
        </Box>

        {/* 双环回灌关系图 */}
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>双环回灌关系</Typography>
          <DualLoopDiagram />
        </Box>
      </Box>
    </Box>
  )
}
