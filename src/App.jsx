import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TopBar from './layout/TopBar'
import Sidebar from './layout/Sidebar'
import DisclaimerBar from './layout/DisclaimerBar'
import { useStore } from './store/useStore'
import { pullAll, pushEntity } from './lib/sync'
import { getGithubToken } from './lib/credentials'
import tokens from './theme/tokens'

// 本地 store 实体 → 云端集合 映射（仅这些实体参与在线同步）
const SYNC_MAP = { trades: 'trades', reviews: 'reviews' }

/**
 * 应用壳层：TopBar(56) → [Sidebar | (Main 滚动区 + 免责声明条 52)]。
 * 纯网页版：挂载时从 GitHub 私有仓库拉取在线数据初始化 store，写操作后防抖推送云端。
 * 未配置凭证时自动回退纯本地模式（localStorage 持久化）。
 */
export default function App() {
  const hydrateFromServer = useStore((s) => s.hydrateFromServer)
  const [syncState, setSyncState] = useState('init') // init | online | local
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    let timer = null

    // 1) 启动：拉取云端数据 → 初始化 store（云端数据优先，空数组保留本地示例）
    ;(async () => {
      try {
        const pulled = await pullAll()
        if (alive) {
          if (pulled) {
            hydrateFromServer(pulled.result)
            setSyncState('online')
          } else {
            setSyncState('local')
          }
        }
      } catch (e) {
        console.warn('[App] 云端拉取失败，回退本地模式', e)
        if (alive) setSyncState('local')
      }
    })()

    // 2) 订阅 store 变化：trades/reviews 变更 → 防抖 1.5s 推送云端
    const unsub = useStore.subscribe((state, prev) => {
      if (!getGithubToken()) return
      for (const entity of Object.keys(SYNC_MAP)) {
        if (state[entity] !== prev[entity]) {
          clearTimeout(timer)
          timer = setTimeout(() => {
            pushEntity(entity, state[entity]).then((ok) => {
              if (!ok) console.warn('[App] 推送失败', entity)
            })
          }, 1500)
        }
      }
    })

    return () => {
      alive = false
      clearTimeout(timer)
      unsub()
    }
  }, [hydrateFromServer])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Outlet />
          </Box>
          <DisclaimerBar />
        </Box>
      </Box>

      {syncState === 'local' && (
        <Box
          onClick={() => navigate('/settings')}
          sx={{
            position: 'fixed',
            left: '50%',
            bottom: 64,
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: tokens.warnSoft,
            color: '#9A6700',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            zIndex: 1200,
            '&:hover': { filter: 'brightness(.97)' },
          }}
        >
          <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 600, color: '#9A6700' }}>
            未连接云端：仅本地保存 · 点击配置 GitHub / DeepSeek 密钥
          </Typography>
        </Box>
      )}
    </Box>
  )
}
