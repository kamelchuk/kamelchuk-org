// API журналу приймальні: /journal (сторінка) і /api/journal/* (дані).
// Доступ: Cloudflare Access (email) → користувач у таблиці «Команда» → роль.
//   admin     — усе, включно з командою, довідниками, видаленням (Юрій, координатор)
//   assistant — створює й веде справи та дії
//   viewer    — лише перегляд і дашборд
// Поле «Приймальні» у користувача (через кому) обмежує, які справи він бачить; порожнє — усі.
import type { JournalStore, User } from './store';
import { accessEmail, type AuthEnv } from './auth';
import { CLOSED_STATUSES, POOR_RATINGS, daysBetween } from './logic';

export interface JournalEnv extends AuthEnv {
  ASSETS: Fetcher;
  JOURNAL: DurableObjectNamespace<JournalStore>;
  JOURNAL_ADMINS?: string;        // email-и через кому, які завжди мають роль admin (перший вхід)
  JOURNAL_EXPORT_TOKEN?: string;  // секрет для вивантаження в Google-таблицю (Apps Script)
}

export const journal = (env: JournalEnv) => env.JOURNAL.get(env.JOURNAL.idFromName('journal'));

const NO_STORE = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin' };
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...NO_STORE } });

function deny(html: boolean, status: number, msg: string) {
  if (!html) return json({ error: msg }, status);
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Журнал приймальні</title><body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#23252b">
<h1 style="font-size:1.5rem">Журнал приймальні</h1><p>${msg}</p>
<p><a href="/cdn-cgi/access/logout">Увійти з іншою адресою</a> · <a href="/">kamelchuk.org</a></p></body>`;
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...NO_STORE } });
}

async function currentUser(request: Request, env: JournalEnv): Promise<User | null> {
  const email = await accessEmail(request, env);
  if (!email) return null;
  const u = await journal(env).getUser(email);
  const admins = (env.JOURNAL_ADMINS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (admins.includes(email)) return { email, name: u?.name ?? email, role: 'admin', offices: '', active: 1 };
  return u && u.active ? u : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
interface ListData { cases: Any[]; actions: Any[]; today: string }
const list = async (store: DurableObjectStub<JournalStore>, offices: string[] = []) => (await store.listCases(offices)) as unknown as ListData;

const officesOf = (u: User) => (u.offices ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const canWrite = (u: User) => u.role === 'admin' || u.role === 'assistant';

function stats(data: ListData) {
  const { cases, actions, today } = data;
  const month = today.slice(0, 7);
  const open = cases.filter((c) => !CLOSED_STATUSES.includes(String(c.status)));
  const count = <T,>(arr: T[], key: (x: T) => string) => {
    const m: Record<string, number> = {};
    for (const x of arr) { const k = key(x) || '—'; m[k] = (m[k] ?? 0) + 1; }
    return m;
  };
  const answeredWithDue = actions.filter((a) => a.answer_date && a.due);
  const answered = actions.filter((a) => a.answer_date && a.date);
  const addressees: Record<string, { total: number; overdue: number; poor: number; answered: number }> = {};
  for (const a of actions) {
    if (!a.addressee) continue;
    const r = (addressees[String(a.addressee)] ??= { total: 0, overdue: 0, poor: 0, answered: 0 });
    r.total++;
    if (a.state === 'overdue') r.overdue++;
    if (a.rating && POOR_RATINGS.includes(String(a.rating))) r.poor++;
    if (a.answer_date) r.answered++;
  }
  const people: Record<string, { open: number; overdue: number; total: number }> = {};
  for (const c of cases) {
    const r = (people[String(c.responsible || '—')] ??= { open: 0, overdue: 0, total: 0 });
    r.total++;
    if (!CLOSED_STATUSES.includes(String(c.status))) r.open++;
    r.overdue += c.overdue;
  }
  const months: { month: string; opened: number; closed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(`${month}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() - i);
    const m = d.toISOString().slice(0, 7);
    months.push({ month: m, opened: cases.filter((c) => String(c.opened ?? '').startsWith(m)).length, closed: cases.filter((c) => String(c.closed ?? '').startsWith(m)).length });
  }
  const attention = actions
    .filter((a) => a.state === 'overdue' || a.state === 'soon' || a.state === 'react')
    .map((a) => {
      const c = cases.find((x) => x.id === a.case_id);
      return { id: a.id, case_id: a.case_id, type: a.type, addressee: a.addressee, due: a.due, state: a.state, state_label: a.state_label, days_left: a.days_left, responsible: a.responsible || c?.responsible, summary: c?.summary };
    })
    .sort((x, y) => String(x.due ?? '').localeCompare(String(y.due ?? '')));
  return {
    today,
    totals: {
      cases: cases.length,
      month: cases.filter((c) => String(c.opened ?? '').startsWith(month)).length,
      open: open.length,
      new: cases.filter((c) => c.status === 'Нова').length,
      actions: actions.length,
      overdue: actions.filter((a) => a.state === 'overdue').length,
      soon: actions.filter((a) => a.state === 'soon').length,
      react: actions.filter((a) => a.state === 'react').length,
      onTime: answeredWithDue.length ? answeredWithDue.filter((a) => String(a.answer_date) <= String(a.due)).length / answeredWithDue.length : null,
      avgDays: answered.length ? answered.reduce((s, a) => s + daysBetween(String(a.date), String(a.answer_date)), 0) / answered.length : null,
    },
    byStatus: count(cases, (c) => String(c.status ?? '')),
    byOffice: count(cases, (c) => String(c.office ?? '')),
    byCategory: count(cases, (c) => String(c.category ?? '')),
    bySource: count(cases, (c) => String(c.source ?? '')),
    people,
    addressees: Object.entries(addressees).map(([name, r]) => ({ name, ...r })).sort((a, b) => b.overdue + b.poor - (a.overdue + a.poor) || b.total - a.total).slice(0, 15),
    months,
    attention,
  };
}

// Колонки як в аркушах Google-таблиці — для CSV і синхронізації.
const CASE_COLS: [string, string][] = [
  ['id', 'ID справи'], ['opened', 'Дата відкриття'], ['source', 'Джерело'], ['initiator', 'Ініціатор (ПІБ / організація)'], ['contact', 'Контакт'],
  ['city', 'Населений пункт'], ['office', 'Приймальня'], ['category', 'Категорія'], ['summary', 'Суть (1–2 речення)'], ['responsible', 'Відповідальний'],
  ['status', 'Статус'], ['next_step', 'Наступний крок'], ['next_date', 'Дата наступного кроку'], ['result', 'Результат'], ['closed', 'Дата закриття'],
  ['files', 'Папка / файли'], ['actions_count', 'Дій (авто)'], ['overdue', 'Прострочено дій (авто)'],
];
const ACTION_COLS: [string, string][] = [
  ['case_id', 'ID справи'], ['date', 'Дата дії'], ['type', 'Тип дії'], ['addressee', 'Адресат (орган, посадова особа)'], ['out_no', 'Вих. №'],
  ['days', 'Днів на відповідь (авто)'], ['due', 'Строк відповіді (авто)'], ['answer_date', 'Дата відповіді'], ['answer_no', 'Вх. № відповіді'],
  ['rating', 'Оцінка відповіді'], ['unanswered', 'На що не відповіли'], ['next_action', 'Наступна дія'], ['state_label', 'Стан (авто)'],
  ['days_left', 'Днів до строку (авто)'], ['file', 'Файл (лінк)'], ['responsible', 'Відповідальний'],
];
function table(rows: Record<string, unknown>[], cols: [string, string][]) {
  return [cols.map((c) => c[1]), ...rows.map((r) => cols.map(([k]) => (r[k] ?? '') as string | number))];
}
const csvCell = (v: unknown) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function body(request: Request) {
  try { return (await request.json()) as Record<string, string | number | null>; } catch { return {}; }
}

export async function handleJournal(request: Request, env: JournalEnv, path: string): Promise<Response> {
  // Синхронізація з Google-таблицею: окремий шлях поза Access, захищений токеном.
  if (path === '/api/sync/journal') {
    if (!env.JOURNAL_EXPORT_TOKEN || request.headers.get('authorization') !== `Bearer ${env.JOURNAL_EXPORT_TOKEN}`) return json({ error: 'unauthorized' }, 401);
    const data = await list(journal(env));
    return json({ updated: new Date().toISOString(), cases: table(data.cases, CASE_COLS), actions: table(data.actions, ACTION_COLS) });
  }

  const isPage = !path.startsWith('/api/');
  const user = await currentUser(request, env);
  if (!user) {
    const configured = env.CF_ACCESS_TEAM_DOMAIN && env.CF_ACCESS_AUD;
    return deny(isPage, 403, configured
      ? 'Цю адресу не додано до команди журналу. Попросіть координатора додати ваш email у розділі «Команда».'
      : 'Журнал ще не підключено до входу Cloudflare Access. Інструкція — у docs/journal.md репозиторію сайту.');
  }

  if (isPage) {
    const res = await env.ASSETS.fetch(new Request(new URL('/journal/', request.url), request));
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(NO_STORE)) out.headers.set(k, v);
    return out;
  }

  // Захист від підробки запитів з інших сайтів: усі зміни — лише з нашим заголовком.
  if (request.method !== 'GET' && request.headers.get('x-journal') !== '1') return json({ error: 'bad request' }, 400);

  const store = journal(env);
  const offices = officesOf(user);
  const seg = path.replace(/^\/api\/journal\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const m = request.method;
  const isAdmin = user.role === 'admin';
  const writeGuard = () => (canWrite(user) ? null : json({ error: 'forbidden' }, 403));
  const inScope = async (caseId: string) => {
    if (!offices.length) return true;
    const c = (await store.getCase(caseId)) as { office?: string } | null;
    return !!c && offices.includes(String(c.office));
  };

  try {
    if (seg[0] === 'me' && m === 'GET') {
      const users = (await store.listUsers()).filter((u) => u.active).map((u) => ({ name: u.name, email: u.email }));
      return json({ user, dicts: await store.getDicts(), users });
    }
    if (seg[0] === 'stats' && m === 'GET') return json(stats(await list(store, offices)));

    if (seg[0] === 'cases') {
      if (seg.length === 1 && m === 'GET') return json((await list(store, offices)).cases);
      if (seg.length === 1 && m === 'POST') {
        const g = writeGuard(); if (g) return g;
        const b = await body(request);
        if (offices.length && !offices.includes(String(b.office))) b.office = offices[0];
        return json(await store.createCase(user.email, b), 201);
      }
      const id = seg[1];
      if (!(await inScope(id))) return json({ error: 'not found' }, 404);
      if (seg.length === 2 && m === 'GET') { const c = await store.getCase(id); return c ? json(c) : json({ error: 'not found' }, 404); }
      if (seg.length === 2 && m === 'PATCH') { const g = writeGuard(); if (g) return g; return json(await store.updateCase(user.email, id, await body(request))); }
      if (seg.length === 2 && m === 'DELETE') { if (!isAdmin) return json({ error: 'forbidden' }, 403); return json({ ok: await store.deleteCase(user.email, id) }); }
      if (seg[2] === 'actions' && m === 'POST') { const g = writeGuard(); if (g) return g; return json(await store.addAction(user.email, id, await body(request)), 201); }
      if (seg[2] === 'notes' && m === 'POST') {
        const b = await body(request);
        return json(await store.addNote(user.email, user.name, id, String(b.text ?? '')), 201);
      }
    }

    if (seg[0] === 'actions' && seg[1]) {
      const g = writeGuard(); if (g) return g;
      const aid = Number(seg[1]);
      const c = (await list(store, offices)).actions.find((a) => a.id === aid);
      if (!c) return json({ error: 'not found' }, 404);
      if (m === 'PATCH') return json(await store.updateAction(user.email, aid, await body(request)));
      if (m === 'DELETE') return json(await store.deleteAction(user.email, aid));
    }

    if (seg[0] === 'export.csv' && m === 'GET') {
      const data = await list(store, offices);
      const sheet = new URL(request.url).searchParams.get('sheet') === 'actions' ? 'actions' : 'cases';
      const rows = sheet === 'actions' ? table(data.actions, ACTION_COLS) : table(data.cases, CASE_COLS);
      const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
      return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="journal-${sheet}-${data.today}.csv"`, ...NO_STORE } });
    }

    if (!isAdmin) return json({ error: 'forbidden' }, 403);
    if (seg[0] === 'users' && m === 'GET') return json(await store.listUsers());
    if (seg[0] === 'users' && m === 'POST') return json(await store.saveUser(user.email, await body(request)));
    if (seg[0] === 'dicts' && seg[1] && m === 'PUT') { const b = await body(request); return json(await store.saveDict(user.email, seg[1], b.items)); }
    if (seg[0] === 'log' && m === 'GET') return json(await store.recentLog());
  } catch (e) {
    return json({ error: (e as Error).message || 'error' }, 400);
  }
  return json({ error: 'not found' }, 404);
}
