/**
 * OpenRouterClient — thin wrapper over OpenRouter's chat completions API.
 * Default model is the free `tencent/hy3:free` (the ESCC AI brain).
 *
 * API key resolves in priority:
 *   1. explicit `apiKey` option
 *   2. browser: import.meta.env.VITE_OPENROUTER_API_KEY
 *   3. node:    process.env.OPENROUTER_API_KEY
 *   4. injected `apiKey` on the EsccAgentContext via `model`/custom field (none yet)
 */

export const DEFAULT_MODEL = "tencent/hy3:free";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type FetchImpl = (
  url: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface OpenRouterOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  /** Inject a fetch impl for testing. Defaults to global fetch. */
  fetchImpl?: FetchImpl;
}

function resolveApiKey(explicit?: string): string {
  if (explicit) return explicit;
  // Browser build (Vite) exposes import.meta.env
  const env = (globalThis as unknown as { importMetaEnv?: Record<string, string> })
    .importMetaEnv;
  if (env?.VITE_OPENROUTER_API_KEY) return env.VITE_OPENROUTER_API_KEY;
  // Node
  if (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  throw new Error(
    "OpenRouter API key not found. Set VITE_OPENROUTER_API_KEY (browser) or OPENROUTER_API_KEY (node), or pass apiKey."
  );
}

export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly fetchImpl: FetchImpl;

  constructor(opts: OpenRouterOptions = {}) {
    this.apiKey = resolveApiKey(opts.apiKey);
    this.model = opts.model ?? DEFAULT_MODEL;
    this.baseUrl = opts.baseUrl ?? OPENROUTER_URL;
    this.maxTokens = opts.maxTokens ?? 1000;
    this.temperature = opts.temperature ?? 0.7;
    this.fetchImpl = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  }

  async chat(system: string, user: string): Promise<string> {
    const res = await this.fetchImpl(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] as ChatMessage[],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }
}
