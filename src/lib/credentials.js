/**
 * 凭证管理 —— 用户的 GitHub Token 与 DeepSeek Key 存放在浏览器 localStorage。
 * 纯网页版不依赖任何后端服务器：密钥仅存于你自己的浏览器，仅在你本机请求时附在 Header 上。
 */

const KEY_GH = 'ciw_github_token'
const KEY_DS = 'ciw_deepseek_key'
const KEY_CIRCLE = 'ciw_circle_token'

export function getGithubToken() {
  try {
    return localStorage.getItem(KEY_GH) || ''
  } catch {
    return ''
  }
}

export function setGithubToken(token) {
  try {
    if (token && token.trim()) localStorage.setItem(KEY_GH, token.trim())
    else localStorage.removeItem(KEY_GH)
  } catch {}
}

export function getDeepseekKey() {
  try {
    return localStorage.getItem(KEY_DS) || ''
  } catch {
    return ''
  }
}

export function setDeepseekKey(key) {
  try {
    if (key && key.trim()) localStorage.setItem(KEY_DS, key.trim())
    else localStorage.removeItem(KEY_DS)
  } catch {}
}

/** 是否已填写两项凭证。 */
export function hasCredentials() {
  return !!getGithubToken() && !!getDeepseekKey()
}

/** 圈子凭证（环球青藤 edu24ol_token，用于「张湧的小密圈」数据源）。 */
export function getCircleToken() {
  try {
    return localStorage.getItem(KEY_CIRCLE) || ''
  } catch {
    return ''
  }
}

export function setCircleToken(token) {
  try {
    if (token && token.trim()) localStorage.setItem(KEY_CIRCLE, token.trim())
    else localStorage.removeItem(KEY_CIRCLE)
  } catch {}
}
