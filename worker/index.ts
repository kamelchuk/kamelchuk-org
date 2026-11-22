// Worker сайту kamelchuk.org: статичні сторінки з dist/ + API форми звернень.
// Звернення й лічильник зберігаються в Durable Object (не потребує створення KV вручну).
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  ASSETS: Fetcher;
  APPEALS: DurableObjectNamespace<AppealsStore>;
  TELEGRAM_BOT_TOKEN?: string;   // секрет, задається в Cloudflare (Settings → Variables and Secrets)
  TELEGRAM_CHAT_IDS?: string;    // id чатів через кому (Юрій, Юлія Бондар)
  SHEETS_WEBHOOK_URL?: string;   // Google Apps Script, що дописує рядок у таблицю
  ADMIN_TOKEN?: string;          // секрет для зміни статусу
}

const STATUSES = ['received', 'in_progress', 'answered'];
const REQUIRED = ['name', 'phone', 'email', 'region', 'city', 'topic', 'text', 'consent'];
const MAX_FILES_BYTES = 10 * 1024 * 1024;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

function kyivNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { year: g('year'), month: g('month'), stamp: `${g('day')}.${g('month')}.${g('year')} ${g('hour')}:${g('minute')}` };
}

export class AppealsStore extends DurableObject {
  // Номер звернення: S{порядковий у місяці}-{місяць}-{рік}, напр. S1-11-2026
  async create(a: Record<string, unknown>) {
    const { year, month, stamp } = kyivNow();
    const key = `counter:${year}-${month}`;
    const n = ((await this.ctx.storage.get<number>(key)) ?? 0) + 1;
    const number = `S${n}-${Number(month)}-${year}`;
    const rec = { ...a, number, date: stamp, status: 'received' };
    await this.ctx.storage.put({ [key]: n, [`appeal:${number}`]: rec });
    return rec;
  }
  async get(number: string) { return (await this.ctx.storage.get<Record<string, unknown>>(`appeal:${number}`)) ?? null; }
  async setStatus(number: string, status: string) {
    const rec = await this.get(number);
    if (!rec) return false;
    await this.ctx.storage.put(`appeal:${number}`, { ...rec, status });
    return true;
  }
}

const store = (env: Env) => env.APPEALS.get(env.APPEALS.idFromName('main'));

async function appeal(request: Request, env: Env, ctx: ExecutionContext) {
  const fd = await request.formData();
  const v = (k: string) => String(fd.get(k) ?? '').trim();
  for (const k of REQUIRED) if (!v(k)) return json({ error: `missing ${k}` }, 400);
  const files = fd.getAll('files').filter((f): f is File => typeof f === 'object' && f !== null && (f as File).size > 0) as File[];
  if (files.reduce((s, f) => s + f.size, 0) > MAX_FILES_BYTES) return json({ error: 'files too large' }, 413);

  const a = await store(env).create({ name: v('name'), phone: v('phone'), email: v('email'), region: v('region'), city: v('city'), topic: v('topic'), text: v('text'), lang: v('lang') || 'uk', files: files.map((f) => f.name) }) as Record<string, string>;
  const summary = `Звернення ${a.number}\n${a.date}\n\n${a.name}\n${a.phone} · ${a.email}\n${a.region}, ${a.city}\nТема: ${a.topic}\n\n${a.text}`;
  const jobs: Promise<unknown>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_IDS) {
    const api = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
    for (const chat of env.TELEGRAM_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)) {
      jobs.push(fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: summary.slice(0, 4000) }) }));
      for (const f of files) {
        const body = new FormData(); body.append('chat_id', chat); body.append('caption', a.number); body.append('document', f, f.name);
        jobs.push(fetch(`${api}/sendDocument`, { method: 'POST', body }));
      }
    }
  }
  if (env.SHEETS_WEBHOOK_URL) {
    jobs.push(fetch(env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) }));
  }
  ctx.waitUntil(Promise.allSettled(jobs));
  return json({ number: a.number });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === 'www.kamelchuk.org') { url.hostname = 'kamelchuk.org'; return Response.redirect(url.toString(), 301); }
    const p = url.pathname.replace(/\/$/, '');
    if (p === '/api/appeal' && request.method === 'POST') return appeal(request, env, ctx);
    if (p === '/api/status' && request.method === 'GET') {
      const n = url.searchParams.get('n')?.trim().toUpperCase() ?? '';
      if (!/^S\d+-\d{1,2}-\d{4}$/.test(n)) return json({ error: 'bad number' }, 400);
      const rec = await store(env).get(n);
      return rec ? json({ number: n, status: rec.status }) : json({ error: 'not found' }, 404);
    }
    if (p === '/api/admin/status' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN || request.headers.get('authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'unauthorized' }, 401);
      const { number, status } = (await request.json()) as { number: string; status: string };
      if (!STATUSES.includes(status)) return json({ error: 'bad status' }, 400);
      return (await store(env).setStatus(String(number).toUpperCase(), status)) ? json({ ok: true }) : json({ error: 'not found' }, 404);
    }
    if (p.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
