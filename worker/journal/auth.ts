// Перевірка входу через Cloudflare Access (Zero Trust).
// Access сам показує сторінку входу (email + одноразовий код) і додає до запиту підписаний JWT
// у заголовку Cf-Access-Jwt-Assertion. Тут ми перевіряємо підпис, aud і строк дії, і беремо email.
// Без налаштованих CF_ACCESS_TEAM_DOMAIN і CF_ACCESS_AUD журнал закритий для всіх.

export interface AuthEnv {
  CF_ACCESS_TEAM_DOMAIN?: string; // напр. kamelchuk.cloudflareaccess.com
  CF_ACCESS_AUD?: string;         // Application Audience (AUD) Tag застосунку Access
  JOURNAL_DEV_EMAIL?: string;     // лише для локальної розробки (працює тільки на localhost)
}

type Jwk = JsonWebKey & { kid?: string };
let certs: { keys: Jwk[]; at: number; team: string } | null = null;

const b64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const b64uJson = (s: string) => JSON.parse(new TextDecoder().decode(b64u(s)));

async function keys(team: string, force = false) {
  if (!force && certs && certs.team === team && Date.now() - certs.at < 3600_000) return certs.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('certs');
  const j = (await r.json()) as { keys: Jwk[] };
  certs = { keys: j.keys, at: Date.now(), team };
  return j.keys;
}

export async function accessEmail(request: Request, env: AuthEnv): Promise<string | null> {
  const host = new URL(request.url).hostname;
  if (env.JOURNAL_DEV_EMAIL && (host === 'localhost' || host === '127.0.0.1')) return env.JOURNAL_DEV_EMAIL.toLowerCase();
  const team = env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const aud = env.CF_ACCESS_AUD;
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!team || !aud || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = b64uJson(parts[0]);
    const payload = b64uJson(parts[1]);
    if (header.alg !== 'RS256') return null;
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    if (payload.iss !== `https://${team}`) return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now - 30) return null;
    if (typeof payload.nbf === 'number' && payload.nbf > now + 30) return null;
    let jwk = (await keys(team)).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await keys(team, true)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return ok && typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
