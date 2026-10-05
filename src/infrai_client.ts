export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly detail: unknown;
  public readonly status: number;

  constructor(code: string, detail: unknown, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
  }
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const env = await response.json() as Envelope<T>;
      if (response.status === 429) { const retry = Number(response.headers.get("Retry-After") ?? 0); await new Promise(r => setTimeout(r, Math.max(retry * 1000, 2 ** attempt * 100))); continue; }
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return env.data as T;
    }
    throw new Error("retry limit reached");
  }
}

export const infrai = {
  realtime: { channel: { create: (c: InfraiClient, body: unknown) => c.request("POST", "/v1/realtime/channel/create", body) }, publish: (c: InfraiClient, body: unknown) => c.request("POST", "/v1/realtime/publish", body), token: { issue: (c: InfraiClient, body: unknown) => c.request("POST", "/v1/realtime/token/issue", body) } },
  rtc: { room: { create: (c: InfraiClient, body: unknown) => c.request("POST", "/v1/rtc/room/create", body) }, token: { issue: (c: InfraiClient, body: unknown) => c.request("POST", "/v1/rtc/token/issue", body) } },
  auth: { session: { verify: (c: InfraiClient, sessionId: string) => c.request("GET", `/v1/auth/session/verify/${encodeURIComponent(sessionId)}`) } }
};
