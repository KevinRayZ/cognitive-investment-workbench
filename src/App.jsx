import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopBar from './layout/TopBar'
import Sidebar from './layout/Sidebar'
import DisclaimerBar from './layout/DisclaimerBar'

/**
 * 应用壳层：TopBar(56) → [Sidebar | (Main 滚动区 + 免责声明条 52)]。
 * 免责声明条九屏统一通过此壳层渲染，单页不可遗漏。
 */
export default function App() {
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
