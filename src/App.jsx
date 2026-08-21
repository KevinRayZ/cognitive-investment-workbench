import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopBar from './layout/TopBar'
import Sidebar from './layout/Sidebar'
import DisclaimerBar from './layout/DisclaimerBar'
import { useStore } from './store/useStore'

// 本地 store 实体 → 云端集合 映射（仅这些集合参与在线同步）
const SYNC_MAP = { trades: 'trades', reviews: 'reviews' }

/**
 * 应用壳层：TopBar(56) → [Sidebar | (Main 滚动区 + 免责声明条 52)]。
 * 免责声明条九屏统一通过此壳层渲染，单页不可遗漏。
 * v2.0.0：挂载时从 GitHub 私有仓库拉取在线数据初始化 store，写操作后防抖推送云端。
 */
export default function App() {
  const hydrateFromServer = useStore((s) => s.hydrateFromServer)

  useEffect(() => {
    let alive = true
    let timer = null

    // 1) 启动：拉取云端数据 → 初始化 store（服务器数据优先，空数组保留本地示例）
    fetch('/api/data')
      .then((r) => r.json())
      .then((json) => {
        if (alive && json.ok) hydrateFromServer(json.data)
      })
      .catch(() => {
        /* 后端未启动：保持本地模式 */
      })

    // 2) 订阅 store 变化：trades/reviews 变更 → 防抖 1.5s 推送云端
    const unsub = useStore.subscribe((state, prev) => {
      for (const [entity, collection] of Object.entries(SYNC_MAP)) {
        if (state[entity] !== prev[entity]) {
          clearTimeout(timer)
          timer = setTimeout(() => {
            fetch(`/api/data/${collection}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: state[entity] }),
            }).catch(() => {})
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
    </Box>
  )
}
