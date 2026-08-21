import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'

const CATS = ['赚钱逻辑', '不碰什么', '风险底线']

/**
 * 投资原则 L1（宪法级细分视图）—— 只读，无编辑入口。
 * 数据来自原则卡片 IS 的 constitution 标记（种子已建立 L1 视图）。
 */
export default function PrincipleL1() {
  const l1 = useStore((s) => s.l1)

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ①"
        title="投资哲学 · 宪法级"
        subtitle="不可违背的硬规则、投资逻辑与能力圈边界（只读视图）"
        status={<StatusPill label="只读" tone="neutral" />}
      />
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {CATS.map((cat) => {
          const items = l1.filter((x) => x.category === cat)
          if (!items.length) return null
          return (
            <Box key={cat}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>{cat}</Typography>
              <Stack spacing={1.5}>
                {items.map((it) => (
                  <Box
                    key={it.id}
                    sx={{
                      p: 2,
                      borderRadius: tokens.radius.md,
                      bgcolor: tokens.surface,
                      border: `1px solid ${tokens.border}`,
                      borderLeft: `4px solid ${tokens.primary}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 14.5 }}>{it.title}</Typography>
                      <StatusPill label="宪法级" tone="primary" size="sm" />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: tokens.ink700, mb: 0.5 }}>
                      <b>规则：</b>
                      {it.rule}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: tokens.ink500, mb: 0.5 }}>
                      <b>边界：</b>
                      {it.boundary}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>
                      <b>认同原因：</b>
                      {it.reason}
                    </Typography>
                    {it.sourceIsId && (
                      <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 0.75, fontFamily: '"Roboto Mono", monospace' }}>
                        来源：{it.sourceIsId}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )
        })}
        <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 1 }}>
          说明：本视图为只读，内容由「原则卡片（IS）」中标记为宪法级的条目同步生成。如需修改，请前往「原则卡片 IS」。
        </Typography>
      </Box>
    </Box>
  )
}
