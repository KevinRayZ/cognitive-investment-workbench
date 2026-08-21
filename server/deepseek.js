/**
 * DeepSeek 大脑 —— OpenAI 兼容接口调用。
 * 工作台内嵌对话区（入口 A）通过本模块调用大模型；
 * system prompt 注入《个人投资体系总纲》核心内容，确保输出严格符合体系。
 */

const API_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

function getKey() {
  const key = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY
  if (!key) {
    throw new Error('缺少 DeepSeek API Key：请在 server/.env 中设置 DEEPSEEK_API_KEY')
  }
  return key.trim()
}

/**
 * 调用 DeepSeek 对话补全。
 * @param {Array<{role:'system'|'user'|'assistant', content:string}>} messages
 * @param {{temperature?:number, maxTokens?:number}} [opts]
 * @returns {Promise<string>} 模型回复文本
 */
export async function chatCompletion(messages, opts = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      stream: false,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

/** 解析对话消息数组中的最后一条用户文本。 */
export function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content
  }
  return ''
}
