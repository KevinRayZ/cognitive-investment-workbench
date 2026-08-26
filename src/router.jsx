import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Memo from './pages/Memo'
import PrincipleIS from './pages/PrincipleIS'
import TradeLogL4 from './pages/TradeLogL4'
import MemoryLayers from './pages/MemoryLayers'
import ReviewL5 from './pages/ReviewL5'
import TargetL3 from './pages/TargetL3'
import MethodL2 from './pages/MethodL2'
import ObservationL6 from './pages/ObservationL6'
import AiProtocol from './pages/AiProtocol'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import FundL3 from './pages/FundL3'
import IndustryWatch from './pages/IndustryWatch'
import StrategyCenter from './pages/StrategyCenter'
import ScoreEngine from './pages/ScoreEngine'
import FundAnalyze from './pages/FundAnalyze'

/**
 * 路由表（十二屏 + 研究列表 + 基金管理 + 行业观察 + 设置）。
 * 所有页面经 App 壳层渲染，统一含 TopBar / Sidebar / 免责声明条。
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'chat', element: <Chat /> },
      { path: 'memo', element: <Memo /> },
      { path: 'principle', element: <PrincipleIS /> },
      { path: 'trade', element: <TradeLogL4 /> },
      { path: 'memory', element: <MemoryLayers /> },
      { path: 'review', element: <ReviewL5 /> },
      { path: 'research', element: <TargetL3 /> },
      { path: 'research/:code', element: <TargetL3 /> },
      { path: 'funds', element: <FundL3 /> },
      { path: 'industry-watch', element: <IndustryWatch /> },
      { path: 'strategy', element: <StrategyCenter /> },
      { path: 'score-engine', element: <ScoreEngine /> },
      { path: 'fund-analyze', element: <FundAnalyze /> },
      { path: 'methods', element: <MethodL2 /> },
      { path: 'inspiration', element: <ObservationL6 /> },
      { path: 'ai-protocol', element: <AiProtocol /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default router
