import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import GitHub from '@mui/icons-material/GitHub'
import SmartToy from '@mui/icons-material/SmartToy'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import { getGithubToken, setGithubToken, getDeepseekKey, setDeepseekKey } from '../lib/credentials'
import { pullAll } from '../lib/sync'
import { useStore } from '../store/useStore'

/**
 * 设置页 —— 用户填写 GitHub Token（数据同步）与 DeepSeek Key（AI 大脑）。
 * 两项均存于本机浏览器 localStorage，不经由任何服务器。
 */
export default function Settings() {
  const [gh, setGh] = useState('')
  const [ds, setDs] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // { ok, msg }

  useEffect(() => {
    setGh(getGithubToken())
    setDs(getDeepseekKey())
  }, [])

  const onSave = async () => {
    setGithubToken(gh)
    setDeepseekKey(ds)
    setSaved(true)
    // 保存后立即使云端数据生效（无需刷新）
    try {
      const pulled = await pullAll()
      if (pulled) useStore.getState().hydrateFromServer(pulled.result)
    } catch {}
    setTimeout(() => setSaved(false), 3000)
  }

  const onTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const pulled = await pullAll()
      if (pulled) setTestResult({ ok: true, msg: 'GitHub 连接成功，已读取云端数据' })
      else setTestResult({ ok: false, msg: '未填写 GitHub Token，无法连接' })
    } catch (e) {
      setTestResult({ ok: false, msg: '连接失败：' + (e.message || e) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 680, mx: 'auto' }}>
      <PageHeader
        breadcrumb="核心工作台"
        title="设置"
        subtitle="配置云端数据同步与 AI 大脑所需的密钥（仅存于本机浏览器）"
      />
      <Stack spacing={3} sx={{ mt: 1 }}>
        <Box sx={{ p: 2.5, borderRadius: 1.5, border: `1px solid ${tokens.border}`, bgcolor: tokens.surface }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <GitHub sx={{ fontSize: 18, color: tokens.ink500 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: tokens.ink700 }}>GitHub Token（数据同步必需）</Typography>
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink400, mb: 1.5 }}>
            用于读写你的私有仓库 investment-data / investment-system，实现跨设备同步。需具备 <b>repo</b> 权限。
            生成地址：github.com/settings/tokens → Generate new token (classic) → 勾选 repo。
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="ghp_xxx 或 github_pat_xxx"
            value={gh}
            onChange={(e) => setGh(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
        </Box>

        <Box sx={{ p: 2.5, borderRadius: 1.5, border: `1px solid ${tokens.border}`, bgcolor: tokens.surface }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <SmartToy sx={{ fontSize: 18, color: tokens.ai }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: tokens.ink700 }}>DeepSeek API Key（AI 对话必需）</Typography>
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink400, mb: 1.5 }}>
            用于 AI 对话大脑。生成地址：platform.deepseek.com/api_keys → 创建 API key。
            密钥仅保存在你本机浏览器，不会上传到任何服务器。
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="sk-xxx"
            value={ds}
            onChange={(e) => setDs(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={onSave} sx={{ borderRadius: 1, px: 3 }}>
            保存设置
          </Button>
          <Button variant="outlined" onClick={onTest} disabled={testing} sx={{ borderRadius: 1, px: 3 }}>
            {testing ? <CircularProgress size={16} /> : '测试 GitHub 连接'}
          </Button>
        </Stack>

        {saved && (
          <Alert severity="success" sx={{ borderRadius: 1 }}>
            已保存，云端数据已同步载入。
          </Alert>
        )}
        {testResult && (
          <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ borderRadius: 1 }}>
            {testResult.msg}
          </Alert>
        )}

        <Alert severity="info" sx={{ borderRadius: 1, fontSize: 12.5 }}>
          说明：纯网页版不依赖任何后端服务器。GitHub Token 与 DeepSeek Key 仅存于你当前浏览器，仅在你发起请求时附带。
          更换浏览器或设备需重新填写；清除浏览器数据会丢失密钥（数据本身安全存放在 GitHub 私有仓库）。
        </Alert>
      </Stack>
    </Box>
  )
}
