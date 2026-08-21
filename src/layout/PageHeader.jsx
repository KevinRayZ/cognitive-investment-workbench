import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'

import tokens from '../theme/tokens'

/**
 * 页面通用页头（高 84）：左面包屑 + 大标题 + 副标题；右侧状态 pill / 操作区。
 * @param {string} [breadcrumb] 面包屑文本（如 "六层认知体系 / Layer ③"）
 * @param {string} title 大标题
 * @param {string} [subtitle] 副标题
 * @param {React.ReactNode} [status] 右侧状态胶囊
 * @param {React.ReactNode} [actions] 右侧操作按钮区
 */
export default function PageHeader({ breadcrumb, title, subtitle, status, actions }) {
  return (
    <Box
      sx={{
        minHeight: 84,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {breadcrumb && (
          <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.5 }}>{breadcrumb}</Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: tokens.ink900 }}>{title}</Typography>
          {status}
        </Box>
        {subtitle && (
          <Typography sx={{ fontSize: 13, color: tokens.ink500, mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>{actions}</Box>
      )}
    </Box>
  )
}

export { Breadcrumbs, Link }
