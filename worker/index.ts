// Worker сайту kamelchuk.org: статичні сторінки з dist/ + API форми звернень.
// Звернення й лічильник зберігаються в Durable Object (не потребує створення KV вручну).
import { DurableObject } from 'cloudflare:workers';
import { handleJournal, journal, type JournalEnv } from './journal/api';
import { SITE_TOPIC_CATEGORY } from './journal/dicts';
import { publicStatus } from './journal/logic';
export { JournalStore } from './journal/store';

export interface Env extends JournalEnv {
  ASSETS: Fetcher;
  APPEALS: DurableObjectNamespace<AppealsStore>;
  TELEGRAM_BOT_TOKEN?: string;   // секрет, задається в Cloudflare (Settings → Variables and Secrets)
  TELEGRAM_CHAT_IDS?: string;    // id чатів через кому (Юрій, Юлія Бондар)
  SHEETS_WEBHOOK_URL?: string;   // Google Apps Script, що дописує рядок у таблицю
  ADMIN_TOKEN?: string;          // секрет для зміни статусу
  JOURNAL_SITE_RESPONSIBLE?: string; // хто веде справи з сайту (типово «Юлія Бондар»)
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
  async link(number: string, kz: string) {
    const rec = await this.get(number);
    if (rec) await this.ctx.storage.put(`appeal:${number}`, { ...rec, kz });
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

  const a = await store(env).create({ name: v('name'), phone: v('phone'), email: v('email'), region: v('region'), city: v('city'), topic: v('topic'), text: v('text'), lang: v('lang') || 'uk', files: files.map((f) => f.name) }) as unknown as Record<string, string>;
  // Кожне звернення з сайту одразу стає справою в журналі приймальні (КЗ-РРРР-NNNN).
  let kz = '';
  try {
    const c = await journal(env).createCase('site', {
      source: 'Звернення з сайту kamelchuk.org', office: 'Kamelchuk.org', status: 'Нова',
      initiator: a.name, contact: `${a.phone} · ${a.email}`, city: `${a.city}, ${a.region}`,
      category: SITE_TOPIC_CATEGORY[a.topic] ?? 'Інше',
      summary: `${a.topic}: ${a.text.replace(/\s+/g, ' ').slice(0, 240)}${a.text.length > 240 ? '…' : ''}`,
      details: a.text, files: files.length ? `Файли зі звернення (${files.length}) — у картці справи` : null,
      responsible: env.JOURNAL_SITE_RESPONSIBLE ?? 'Юлія Бондар', site_number: a.number,
    }) as { id: string } | null;
    kz = c?.id ?? '';
    if (kz) await store(env).link(a.number, kz);
  } catch (e) { console.error('journal', e); }
  // Громадянин отримує номер справи КЗ (єдина нумерація з журналом); S-номер лишається запасним.
  const shown = kz || a.number;
  const summary = `Звернення ${shown}${kz ? ` (сайт ${a.number})` : ''}\n${a.date}\n\n${a.name}\n${a.phone} · ${a.email}\n${a.region}, ${a.city}\nТема: ${a.topic}\n\n${a.text}`;
  const jobs: Promise<unknown>[] = [];
  // Черга для бота-асистента (Крістофер забирає звернення і надсилає Юрію та Юлії, разом із файлами).
  try {
    await journal(env).queueNotify(kz, summary, await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type, data: await f.arrayBuffer() }))));
  } catch (e) { console.error('notify', e); }

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_IDS) {
    const api = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
    for (const chat of env.TELEGRAM_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)) {
      jobs.push(fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: summary.slice(0, 4000) }) }));
      for (const f of files) {
        const body = new FormData(); body.append('chat_id', chat); body.append('caption', shown); body.append('document', f, f.name);
        jobs.push(fetch(`${api}/sendDocument`, { method: 'POST', body }));
      }
    }
  }
  if (env.SHEETS_WEBHOOK_URL) {
    jobs.push(fetch(env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...a, kz }) }));
  }
  ctx.waitUntil(Promise.allSettled(jobs));
  return json({ number: shown });
}

// ---------- публічна перевірка статусу ----------
// Номер КЗ йде підряд, тому одного номера мало: потрібне ще прізвище (або назва організації) заявника,
// чи останні 4 цифри телефону. Плюс обмеження: 10 перевірок за 10 хвилин з однієї адреси.
const FALLBACK_CONTACTS: Record<string, string> = {
  'Валерій Давидюк': '+38 068 128 30 38',
  'Юлія Бондар': '+38 097 316 08 08',
};
const GENERAL_CONTACT = 'zvernennia@kamelchuk.org';
const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[ʼ’'`]/g, '').replace(/ё/g, 'е');
const words = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
const digits = (s: string) => s.replace(/\D/g, '');

function factorOk(input: string, initiator: string, contact: string) {
  const v = input.trim();
  if (/^\d{4}$/.test(v)) { const d = digits(contact); return d.length >= 4 && d.endsWith(v); }
  const w = words(v);
  if (!w.length) return false;
  const have = new Set(words(initiator));
  return w.every((x) => have.has(x));
}

// «Петренко Іван Іванович» → «Петренко І. І.»; ініціали й назви організацій лишаємо як є.
function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  const isName = parts.length >= 2 && parts.length <= 3 && parts.every((x) => /^\p{Lu}[\p{Ll}ʼ’'-]+$/u.test(x));
  return isName ? `${parts[0]} ${parts.slice(1).map((x) => `${x[0]}.`).join(' ')}` : full.trim();
}
const uaDate = (iso?: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : iso ?? '');

async function status(request: Request, env: Env, url: URL) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const j = journal(env);
  if (!(await j.rateOk(`status:${ip}`, 10, 10 * 60_000))) return json({ error: 'too many' }, 429);
  // Номер справи КЗ-2026-0001 (латинські K/З теж приймаємо) або старий S1-11-2026.
  const n = (url.searchParams.get('n')?.trim().toUpperCase() ?? '').replace(/^(KZ|КZ|KЗ)-/, 'КЗ-');
  const who = url.searchParams.get('who')?.slice(0, 100) ?? '';
  if (!who.trim()) return json({ error: 'need who' }, 400);
  let id = '';
  let siteRec: Record<string, string> | null = null;
  if (/^КЗ-\d{4}-\d{1,4}$/.test(n)) {
    const [, y, q] = n.split('-');
    id = `КЗ-${y}-${q.padStart(4, '0')}`;
  } else if (/^S\d+-\d{1,2}-\d{4}$/.test(n)) {
    siteRec = (await store(env).get(n)) as Record<string, string> | null;
    if (!siteRec) return json({ error: 'not found' }, 404);
    id = siteRec.kz || (((await j.caseBySiteNumber(n).catch(() => null)) as { id?: string } | null)?.id ?? '');
  } else return json({ error: 'bad number' }, 400);

  const c = id ? await j.publicCase(id) : null;
  if (c) {
    if (!factorOk(who, c.initiator ?? '', c.contact ?? '')) return json({ error: 'not found' }, 404);
    const contact = c.responsible_contact || FALLBACK_CONTACTS[c.responsible] || GENERAL_CONTACT;
    return json({ number: c.id, status: publicStatus(c.status), opened: uaDate(c.opened), initiator: shortName(c.initiator ?? ''), responsible: c.responsible ?? '', contact });
  }
  if (siteRec && factorOk(who, siteRec.name ?? '', siteRec.phone ?? '')) {
    return json({ number: n, status: siteRec.status, opened: String(siteRec.date ?? '').slice(0, 10), initiator: shortName(siteRec.name ?? ''), responsible: '', contact: GENERAL_CONTACT });
  }
  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === 'www.kamelchuk.org') { url.hostname = 'kamelchuk.org'; return Response.redirect(url.toString(), 301); }
    const p = url.pathname.replace(/\/$/, '');
    if (p === '/api/appeal' && request.method === 'POST') return appeal(request, env, ctx);
    if (p === '/api/status' && request.method === 'GET') return status(request, env, url);
    if (p === '/api/admin/status' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN || request.headers.get('authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'unauthorized' }, 401);
      const { number, status } = (await request.json()) as { number: string; status: string };
      if (!STATUSES.includes(status)) return json({ error: 'bad status' }, 400);
      return (await store(env).setStatus(String(number).toUpperCase(), status)) ? json({ ok: true }) : json({ error: 'not found' }, 404);
    }
    if (p === '/journal' || p.startsWith('/journal/') || p === '/api/journal' || p.startsWith('/api/journal/') || p === '/api/sync/journal' || p === '/api/sync/import' || p.startsWith('/api/sync/csv/') || p.startsWith('/api/notify/')) return handleJournal(request, env, p);
    if (p.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
