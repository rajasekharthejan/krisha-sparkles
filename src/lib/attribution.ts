const UTM_COOKIE = "ks_utm";
const COOKIE_DAYS = 30;

interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  captured_at: string;
}

export function setUTMCookie(params: URLSearchParams): void {
  if (typeof document === "undefined") return;
  const utm: UTMData = { captured_at: new Date().toISOString() };
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  let hasUTM = false;
  for (const key of keys) {
    const val = params.get(key);
    if (val) { utm[key] = val; hasUTM = true; }
  }
  if (!hasUTM) return;
  const expires = new Date(Date.now() + COOKIE_DAYS * 86400 * 1000).toUTCString();
  document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(utm))}; path=/; expires=${expires}; SameSite=Lax`;
}

export function getUTMCookie(): UTMData | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + UTM_COOKIE + "=([^;]*)"));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

export function clearUTMCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${UTM_COOKIE}=; path=/; max-age=0`;
}
