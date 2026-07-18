/**
 * AI Settings — API key storage & provider configuration.
 *
 * Editor-layer only. The engine never imports this; animations produced with
 * AI are plain timeline JSON, so nothing here leaks into the core.
 *
 * Keys are stored in localStorage with base64 obfuscation (obfuscation, NOT
 * encryption — a determined local attacker can still read them; this only keeps
 * plaintext keys out of casual view / sync payloads).
 */

export type AIProvider = 'openai' | 'gemini' | 'anthropic'

export interface AIProviderConfig {
  apiKey: string // base64-encoded
  model: string // selected model ID
  enabled: boolean
}

export interface AIConfig {
  activeProvider: AIProvider
  providers: Record<AIProvider, AIProviderConfig>
}

export const PROVIDER_MODELS: Record<AIProvider, { id: string; label: string }[]> = {
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o3-mini', label: 'o3-mini' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic',
}

const AI_CONFIG_KEY = 'tinyfly:ai:config'

function obfuscate(key: string): string {
  try {
    return btoa(key)
  } catch {
    return key
  }
}

function deobfuscate(encoded: string): string {
  try {
    return atob(encoded)
  } catch {
    return encoded
  }
}

function getDefaultConfig(): AIConfig {
  return {
    activeProvider: 'anthropic',
    providers: {
      openai: { apiKey: '', model: 'gpt-4o', enabled: true },
      gemini: { apiKey: '', model: 'gemini-2.0-flash', enabled: true },
      anthropic: { apiKey: '', model: 'claude-sonnet-4-5-20250929', enabled: true },
    },
  }
}

export function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const defaults = getDefaultConfig()
      // Merge with defaults so older/partial configs still resolve every field.
      return {
        activeProvider: parsed.activeProvider || defaults.activeProvider,
        providers: {
          openai: { ...defaults.providers.openai, ...parsed.providers?.openai },
          gemini: { ...defaults.providers.gemini, ...parsed.providers?.gemini },
          anthropic: { ...defaults.providers.anthropic, ...parsed.providers?.anthropic },
        },
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return getDefaultConfig()
}

export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
  } catch {
    /* ignore storage errors */
  }
}

export function getApiKey(provider: AIProvider): string {
  const config = loadAIConfig()
  const encoded = config.providers[provider]?.apiKey || ''
  return encoded ? deobfuscate(encoded) : ''
}

export function setApiKey(provider: AIProvider, key: string): void {
  const config = loadAIConfig()
  config.providers[provider].apiKey = key ? obfuscate(key) : ''
  saveAIConfig(config)
}

export function setActiveProvider(provider: AIProvider): void {
  const config = loadAIConfig()
  config.activeProvider = provider
  saveAIConfig(config)
}

export function setModel(provider: AIProvider, model: string): void {
  const config = loadAIConfig()
  config.providers[provider].model = model
  saveAIConfig(config)
}

export function hasAnyApiKey(): boolean {
  const config = loadAIConfig()
  return Object.values(config.providers).some((p) => p.apiKey !== '')
}

export function getActiveProviderConfig(): { provider: AIProvider; model: string; apiKey: string } {
  const config = loadAIConfig()
  const provider = config.activeProvider
  return {
    provider,
    model: config.providers[provider].model,
    apiKey: getApiKey(provider),
  }
}
