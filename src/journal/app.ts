// Журнал приймальні — інтерфейс (без фреймворків). Маршрути через #:
//   #/            дашборд           #/cases?...  усі справи з фільтрами
//   #/my          мої справи        #/new        майстер нової справи
//   #/case/ID     картка справи     #/team, #/dicts — для координатора
import { STATE_LABEL, kyivToday, addDays, CLOSED_STATUSES, POOR_RATINGS } from '../../worker/journal/logic';
import type { Dicts } from '../../worker/journal/dicts';
import { HELP_HTML } from './help';

type Any = Record<string, any>;
interface Me { email: string; name: string; role: 'admin' | 'assistant' | 'viewer'; offices: string }

let ME: Me;
let D: Dicts;
let PEOPLE: { name: string; email: string }[] = [];
const view = document.getElementById('view')!;

// ---------- утиліти ----------
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const fd = (iso?: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '');
const fdt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const canWrite = () => ME.role === 'admin' || ME.role === 'assistant';
const isAdmin = () => ME.role === 'admin';
const enc = encodeURIComponent;
const link = (v: string) => (/^https?:\/\//.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener">відкрити ↗</a>` : esc(v));
const plural = (n: number, a: string, b: string, c: string) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };

async function api<T = Any>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const r = await fetch(`/api/journal/${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-journal': '1' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error === 'forbidden' ? 'Недостатньо прав для цієї дії' : j.error || `Помилка ${r.status}`);
  return j as T;
}

function toast(msg: string, bad = false) {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = `toast${bad ? ' bad' : ''}`;
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

const formData = (f: HTMLFormElement) => Object.fromEntries([...new FormData(f).entries()].map(([k, v]) => [k, String(v).trim()]));

function chips(name: string, options: string[], value?: string | null, required = false) {
  return `<div class="chips">${options.map((o, i) => `<label class="chip"><input type="radio" name="${esc(name)}" value="${esc(o)}" ${o === value ? 'checked' : ''} ${required && i === 0 ? 'required' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
}
function select(name: string, options: string[], value?: string | null, empty = '—') {
  const opts = [...options];
  if (value && !opts.includes(value)) opts.push(value);
  return `<select name="${esc(name)}"><option value="">${esc(empty)}</option>${opts.map((o) => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
}
const field = (label: string, inner: string, hint = '') => `<div class="field"><label>${label}</label>${inner}${hint ? `<small class="muted">${hint}</small>` : ''}</div>`;
const input = (name: string, value: unknown = '', type = 'text', extra = '') => `<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}>`;

function statusBadge(s?: string | null) {
  const cls = !s || s === 'Нова' ? 'new' : CLOSED_STATUSES.includes(s) ? (s === 'Вирішено' ? 'done' : 'closed') : s === 'Повторний запит' ? 'warn' : 'work';
  return `<span class="badge st-${cls}">${esc(s || 'Нова')}</span>`;
}
const stateBadge = (state: string, label?: string) => `<span class="badge as-${esc(state)}">${esc(label ?? STATE_LABEL[state as keyof typeof STATE_LABEL] ?? state)}</span>`;
function indicators(c: Any) {
  const out: string[] = [];
  if (c.overdue) out.push(`<span class="dot red" title="Прострочено">${c.overdue}</span>`);
  if (c.soon) out.push(`<span class="dot yellow" title="Строк спливає">${c.soon}</span>`);
  if (c.react) out.push(`<span class="dot orange" title="Потрібна реакція">${c.react}</span>`);
  return out.join('');
}

// ---------- каркас ----------
function nav() {
  const route = location.hash.split('?')[0] || '#/';
  const items: [string, string][] = [['#/', 'Дашборд'], ['#/cases', 'Усі справи'], ['#/my', 'Мої справи']];
  if (isAdmin()) items.push(['#/team', 'Команда'], ['#/dicts', 'Довідники']);
  items.push(['#/help', '📘 Інструкція']);
  document.getElementById('nav')!.innerHTML = items.map(([h, t]) => `<a href="${h}" class="${route === h ? 'active' : ''}${h === '#/help' ? ' help' : ''}">${t}</a>`).join('')
    + (canWrite() ? '<a href="#/new" class="btn btn-primary new">+ Нова справа</a>' : '');
  document.getElementById('me')!.innerHTML = `<span>${esc(ME.name)}</span><small>${{ admin: 'координатор', assistant: 'помічник', viewer: 'перегляд' }[ME.role]}</small><a href="/cdn-cgi/access/logout" title="Вийти">Вийти</a>`;
}

async function route() {
  const [path, qs] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(qs ?? '');
  const parts = (path || '/').split('/').filter(Boolean).map(decodeURIComponent);
  nav();
  view.innerHTML = '<p class="muted loading">Завантаження…</p>';
  window.scrollTo(0, 0);
  try {
    if (!parts.length) return await dashboard();
    if (parts[0] === 'cases') return await casesView(params, false);
    if (parts[0] === 'my') return await casesView(params, true);
    if (parts[0] === 'new') return wizard();
    if (parts[0] === 'case' && parts[1]) return await caseView(parts[1], params);
    if (parts[0] === 'team' && isAdmin()) return await teamView();
    if (parts[0] === 'dicts' && isAdmin()) return dictsView();
    if (parts[0] === 'help') return helpView(params);
    view.innerHTML = '<p>Сторінку не знайдено. <a href="#/">На дашборд</a></p>';
  } catch (e) {
    view.innerHTML = `<div class="card err">${esc((e as Error).message)}</div>`;
  }
}

// ---------- дашборд ----------
function bars(data: Record<string, number>, order?: string[], href?: (k: string) => string) {
  const keys = order ? [...order.filter((k) => data[k]), ...Object.keys(data).filter((k) => !order.includes(k))] : Object.keys(data).sort((a, b) => data[b] - data[a]);
  const max = Math.max(1, ...Object.values(data));
  if (!keys.length) return '<p class="muted">Поки немає даних.</p>';
  return `<div class="bars">${keys.map((k) => `<a class="bar" ${href ? `href="${href(k)}"` : ''}><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${(100 * data[k]) / max}%"></i></span><b>${data[k]}</b></a>`).join('')}</div>`;
}

async function dashboard() {
  const s = await api('stats');
  const t = s.totals;
  const tile = (label: string, value: string | number, cls = '', href = '') =>
    `<a class="tile ${cls}" ${href ? `href="${href}"` : ''}><b>${value}</b><span>${label}</span></a>`;
  const pct = t.onTime === null ? '—' : `${Math.round(t.onTime * 100)}%`;
  const avg = t.avgDays === null ? '—' : `${t.avgDays.toFixed(1)} дн.`;
  const maxM = Math.max(1, ...s.months.map((m: Any) => Math.max(m.opened, m.closed)));
  const monthName = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleString('uk-UA', { month: 'short' });
  view.innerHTML = `
  <div class="head"><h1>Дашборд</h1><span class="muted">станом на ${fd(s.today)}</span></div>
  <div class="tiles">
    ${tile('справ у роботі', t.open, '', '#/cases?open=1')}
    ${tile('нових, без руху', t.new, t.new ? 'blue' : '', '#/cases?status=Нова')}
    ${tile('🔴 прострочено відповідей', t.overdue, t.overdue ? 'red' : '', '#/cases?flag=overdue')}
    ${tile('🟡 строк спливає (≤3 дні)', t.soon, t.soon ? 'yellow' : '', '#/cases?flag=soon')}
    ${tile('🟠 неповні / відписки', t.react, t.react ? 'orange' : '', '#/cases?flag=react')}
    ${tile('справ за цей місяць', t.month)}
    ${tile('відповідей у строк', pct)}
    ${tile('середній час відповіді', avg)}
  </div>
  <div class="grid2">
    <section class="card span2"><h2>Потребує уваги</h2>
      ${s.attention.length ? `<div class="att">${s.attention.slice(0, 30).map((a: Any) => `
        <a class="att-row" href="#/case/${enc(a.case_id)}">
          ${stateBadge(a.state, a.state_label)}
          <span class="att-id">${esc(a.case_id)}</span>
          <span class="att-main"><b>${esc(a.type)}</b> → ${esc(a.addressee || '—')}<br><small class="muted">${esc(a.summary || '')}</small></span>
          <span class="att-due">${a.due ? `строк ${fd(a.due)}` : ''}${a.days_left !== null && a.days_left !== undefined ? `<br><small>${a.days_left < 0 ? `${-a.days_left} дн. тому` : `ще ${a.days_left} дн.`}</small>` : ''}</span>
          <span class="att-who muted">${esc(a.responsible || '')}</span>
        </a>`).join('')}</div>` : '<p class="muted">Усе в строк. Прострочених і проблемних відповідей немає.</p>'}
    </section>
    <section class="card"><h2>Справи за статусом</h2>${bars(s.byStatus, D.statuses, (k) => `#/cases?status=${enc(k)}`)}</section>
    <section class="card"><h2>За приймальнями</h2>${bars(s.byOffice, D.offices, (k) => `#/cases?office=${enc(k)}`)}</section>
    <section class="card"><h2>За категоріями</h2>${bars(s.byCategory, undefined, (k) => `#/cases?category=${enc(k)}`)}</section>
    <section class="card"><h2>Звідки приходять справи</h2>${bars(s.bySource)}</section>
    <section class="card"><h2>Навантаження команди</h2>
      <table class="tbl"><thead><tr><th>Відповідальний</th><th>У роботі</th><th>🔴</th><th>Усього</th></tr></thead><tbody>
      ${Object.entries(s.people as Record<string, Any>).sort((a, b) => b[1].open - a[1].open).map(([n, r]) => `<tr><td><a href="#/cases?responsible=${enc(n)}&open=1">${esc(n)}</a></td><td>${r.open}</td><td>${r.overdue || ''}</td><td>${r.total}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Поки немає справ.</td></tr>'}
      </tbody></table></section>
    <section class="card"><h2>Нові й закриті за 6 місяців</h2>
      <div class="months">${s.months.map((m: Any) => `<div class="mcol"><div class="mbars"><i class="o" style="height:${(100 * m.opened) / maxM}%" title="Нових: ${m.opened}"></i><i class="c" style="height:${(100 * m.closed) / maxM}%" title="Закрито: ${m.closed}"></i></div><small>${monthName(m.month)}</small><small class="muted">${m.opened}/${m.closed}</small></div>`).join('')}</div>
      <p class="legend"><i class="o"></i> нові <i class="c"></i> закриті</p></section>
    <section class="card span2"><h2>Рейтинг органів: прострочені та неповні відповіді</h2>
      <table class="tbl"><thead><tr><th>Адресат</th><th>Дій</th><th>Відповіли</th><th>🔴 Прострочено</th><th>🟠 Неповні / відписки</th></tr></thead><tbody>
      ${s.addressees.map((a: Any) => `<tr><td>${esc(a.name)}</td><td>${a.total}</td><td>${a.answered}</td><td>${a.overdue || ''}</td><td>${a.poor || ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Поки немає дій.</td></tr>'}
      </tbody></table></section>
  </div>`;
}

// ---------- список справ ----------
async function casesView(params: URLSearchParams, mine: boolean) {
  const all = await api<Any[]>('cases');
  const f = {
    q: params.get('q') ?? '', status: params.get('status') ?? '', office: params.get('office') ?? '', category: params.get('category') ?? '',
    responsible: mine ? ME.name : params.get('responsible') ?? '', open: mine ? params.get('open') !== '0' : params.get('open') === '1', flag: params.get('flag') ?? '',
  };
  const q = f.q.toLowerCase();
  const list = all.filter((c) =>
    (!f.status || c.status === f.status) && (!f.office || c.office === f.office) && (!f.category || c.category === f.category)
    && (!f.responsible || c.responsible === f.responsible) && (!f.open || !CLOSED_STATUSES.includes(c.status))
    && (!f.flag || c[f.flag] > 0)
    && (!q || [c.id, c.initiator, c.contact, c.city, c.summary, c.site_number].some((v) => String(v ?? '').toLowerCase().includes(q))));
  const base = mine ? '#/my' : '#/cases';
  const flagName: Record<string, string> = { overdue: '🔴 з простроченими відповідями', soon: '🟡 строк спливає', react: '🟠 потрібна реакція' };
  view.innerHTML = `
  <div class="head"><h1>${mine ? 'Мої справи' : 'Усі справи'}</h1><span class="muted">${list.length} ${plural(list.length, 'справа', 'справи', 'справ')}${f.flag ? ` · ${flagName[f.flag] ?? ''} <a href="${base}">скинути</a>` : ''}</span>
    <span class="grow"></span>
    <a class="btn btn-outline sm" href="/api/journal/export.csv?sheet=cases">⬇ Справи CSV</a>
    <a class="btn btn-outline sm" href="/api/journal/export.csv?sheet=actions">⬇ Дії CSV</a>
  </div>
  <form class="filters" id="flt">
    <input name="q" type="search" placeholder="Пошук: ID, ПІБ, телефон, суть…" value="${esc(f.q)}">
    ${select('status', D.statuses, f.status, 'Усі статуси')}
    ${select('office', D.offices, f.office, 'Усі приймальні')}
    ${select('category', D.categories, f.category, 'Усі категорії')}
    ${mine ? '' : select('responsible', [...new Set([...D.responsible, ...PEOPLE.map((p) => p.name)])], f.responsible, 'Усі відповідальні')}
    <label class="check"><input type="checkbox" name="open" value="1" ${f.open ? 'checked' : ''}> лише відкриті</label>
  </form>
  <div class="rows">
    <div class="row hdr"><span>ID</span><span>Дата</span><span>Ініціатор</span><span>Суть</span><span>Приймальня</span><span>Відповідальний</span><span>Статус</span></div>
    ${list.map((c) => `<a class="row" href="#/case/${enc(c.id)}">
      <span class="id">${esc(c.id)} ${indicators(c)}</span>
      <span class="muted">${fd(c.opened)}</span>
      <span><b>${esc(c.initiator || '—')}</b><small class="muted">${esc(c.city || '')}</small></span>
      <span class="sum">${esc(c.summary || '')}<small class="muted">${esc(c.category || '')}${c.actions_count ? ` · ${c.actions_count} ${plural(c.actions_count, 'дія', 'дії', 'дій')}` : ''}${c.next_due ? ` · строк ${fd(c.next_due)}` : ''}</small></span>
      <span>${esc(c.office || '')}</span>
      <span>${esc(c.responsible || '')}</span>
      <span>${statusBadge(c.status)}</span>
    </a>`).join('') || `<p class="muted empty">Справ не знайдено.${canWrite() ? ' <a href="#/new">Створити нову справу</a>' : ''}</p>`}
  </div>`;
  const flt = document.getElementById('flt') as HTMLFormElement;
  const apply = () => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(formData(flt))) if (v) p.set(k, v);
    if (mine && !flt.querySelector<HTMLInputElement>('[name=open]')!.checked) p.set('open', '0');
    if (f.flag) p.set('flag', f.flag);
    history.replaceState(null, '', `${base}?${p}`);
    casesView(p, mine).then(() => { const qi = document.querySelector<HTMLInputElement>('#flt [name=q]'); if (qi && document.activeElement !== qi && p.get('q')) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } });
  };
  flt.addEventListener('change', apply);
  let timer: number | undefined;
  flt.q.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(apply, 350); });
  flt.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
}

// ---------- майстер нової справи ----------
function wizard() {
  if (!canWrite()) { view.innerHTML = '<p>У вас доступ лише на перегляд.</p>'; return; }
  const myOffice = (ME.offices || '').split(',').map((s) => s.trim()).filter(Boolean)[0];
  const draft: Any = { opened: kyivToday(), status: 'Нова', responsible: D.responsible.includes(ME.name) ? ME.name : '', office: myOffice ?? '' };
  const steps = [
    { title: 'Звідки справа', html: () => `
      ${field('Джерело *', chips('source', D.sources, draft.source, true))}
      ${field('Приймальня *', chips('office', D.offices, draft.office, true))}
      ${field('Дата відкриття', input('opened', draft.opened, 'date'), 'Дата надходження листа чи звернення')}` },
    { title: 'Хто звертається', html: () => `
      ${field('Ініціатор (ПІБ або організація) *', input('initiator', draft.initiator, 'text', 'required autocomplete="off"'))}
      ${field('Контакт', input('contact', draft.contact, 'text', 'placeholder="Телефон, email"'))}
      ${field('Населений пункт', input('city', draft.city, 'text', 'placeholder="Згідно з документом"'))}` },
    { title: 'Суть справи', html: () => `
      ${field('Категорія *', chips('category', D.categories, draft.category, true))}
      ${field('Суть (1–2 речення) *', `<textarea name="summary" rows="3" required maxlength="600">${esc(draft.summary)}</textarea>`)}
      ${field('Детальніше', `<textarea name="details" rows="4">${esc(draft.details)}</textarea>`, 'Необов\'язково: повний текст, обставини')}
      ${field('Папка / файли', input('files', draft.files, 'url', 'placeholder="Посилання на папку чи скан у Drive"'))}` },
    { title: 'Хто веде і що далі', html: () => `
      ${field('Відповідальний *', chips('responsible', D.responsible, draft.responsible, true))}
      ${field('Наступний крок', input('next_step', draft.next_step, 'text', 'placeholder="Напр.: підготувати депутатське звернення до ОДА"'))}
      ${field('Дата наступного кроку', input('next_date', draft.next_date, 'date'))}` },
    { title: 'Перевірка', html: () => `
      <dl class="review">${([['Джерело', 'source'], ['Приймальня', 'office'], ['Дата відкриття', 'opened'], ['Ініціатор', 'initiator'], ['Контакт', 'contact'], ['Населений пункт', 'city'], ['Категорія', 'category'], ['Суть', 'summary'], ['Детальніше', 'details'], ['Папка / файли', 'files'], ['Відповідальний', 'responsible'], ['Наступний крок', 'next_step'], ['Дата наступного кроку', 'next_date']] as const)
        .filter(([, k]) => draft[k]).map(([l, k]) => `<dt>${l}</dt><dd>${k.includes('date') || k === 'opened' ? fd(draft[k]) : esc(draft[k])}</dd>`).join('')}</dl>
      <p class="muted">Номер КЗ присвоїться автоматично після збереження.</p>` },
  ];
  let i = 0;
  const show = () => {
    view.innerHTML = `
    <div class="head"><h1>Нова справа</h1></div>
    <ol class="steps">${steps.map((s, n) => `<li class="${n === i ? 'on' : n < i ? 'done' : ''}"><span>${n + 1}</span>${s.title}</li>`).join('')}</ol>
    <form class="card wiz" id="wz" novalidate>
      <h2>${i + 1}. ${steps[i].title}</h2>
      ${steps[i].html()}
      <div class="wiz-nav">
        ${i ? '<button type="button" class="btn btn-outline" id="back">← Назад</button>' : '<a class="btn btn-outline" href="#/cases">Скасувати</a>'}
        <button class="btn btn-primary" type="submit">${i === steps.length - 1 ? 'Створити справу' : 'Далі →'}</button>
      </div>
    </form>`;
    const f = document.getElementById('wz') as HTMLFormElement;
    f.querySelector<HTMLElement>('input:not([type=radio]),textarea')?.focus();
    document.getElementById('back')?.addEventListener('click', () => { Object.assign(draft, formData(f)); i--; show(); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      Object.assign(draft, formData(f));
      const missing = [...f.querySelectorAll<HTMLInputElement>('[required]')].find((el) => (el.type === 'radio' ? !f.querySelector(`[name="${el.name}"]:checked`) : !el.value.trim()));
      if (missing) { toast('Заповніть обов\'язкові поля (*)', true); missing.closest('.field')?.classList.add('miss'); return; }
      if (i < steps.length - 1) { i++; show(); return; }
      const btn = f.querySelector<HTMLButtonElement>('[type=submit]')!;
      btn.disabled = true;
      try {
        const c = await api('cases', 'POST', draft);
        toast(`Справу ${c.id} створено`);
        location.hash = `#/case/${enc(c.id)}?new=1`;
      } catch (err) { toast((err as Error).message, true); btn.disabled = false; }
    });
  };
  show();
}

// ---------- картка справи ----------
function caseFields(c: Any) {
  return `
  <div class="g2f">
    ${field('Джерело', select('source', D.sources, c.source))}
    ${field('Приймальня', select('office', D.offices, c.office))}
    ${field('Дата відкриття', input('opened', c.opened, 'date'))}
    ${field('Категорія', select('category', D.categories, c.category))}
    ${field('Ініціатор', input('initiator', c.initiator))}
    ${field('Контакт', input('contact', c.contact))}
    ${field('Населений пункт', input('city', c.city))}
    ${field('Відповідальний', select('responsible', D.responsible, c.responsible))}
  </div>
  ${field('Суть (1–2 речення)', `<textarea name="summary" rows="2">${esc(c.summary)}</textarea>`)}
  ${field('Детальніше', `<textarea name="details" rows="4">${esc(c.details)}</textarea>`)}
  <div class="g2f">
    ${field('Наступний крок', input('next_step', c.next_step))}
    ${field('Дата наступного кроку', input('next_date', c.next_date, 'date'))}
    ${field('Папка / файли', input('files', c.files))}
    ${field('Дата закриття', input('closed', c.closed, 'date'))}
  </div>
  ${field('Результат', `<textarea name="result" rows="2">${esc(c.result)}</textarea>`)}`;
}

function actionCard(a: Any) {
  const w = canWrite();
  return `<div class="act as-b-${esc(a.state)}" data-id="${a.id}">
    <div class="act-top">
      <span class="act-date">${fd(a.date)}</span>
      <b>${esc(a.type || 'Дія')}</b>
      ${stateBadge(a.state, a.state_label)}
      <span class="grow"></span>
      ${w ? `<span class="act-btns">${!a.answer_date && a.due ? '<button class="btn btn-primary sm" data-do="answer">Записати відповідь</button>' : ''}<button class="lnk" data-do="edit">Змінити</button>${isAdmin() ? '<button class="lnk red" data-do="del">Видалити</button>' : ''}</span>` : ''}
    </div>
    <div class="act-body">
      <span>→ ${esc(a.addressee || '—')}${a.out_no ? ` · вих. № ${esc(a.out_no)}` : ''}</span>
      ${a.due ? `<span>Строк відповіді: <b>${fd(a.due)}</b> (${a.days} дн.)${a.days_left !== null && !a.answer_date ? ` · ${a.days_left < 0 ? `прострочено на ${-a.days_left} дн.` : `залишилось ${a.days_left} дн.`}` : ''}</span>` : ''}
      ${a.answer_date ? `<span>Відповідь ${fd(a.answer_date)}${a.answer_no ? `, вх. № ${esc(a.answer_no)}` : ''}${a.rating ? ` · оцінка: <b>${esc(a.rating)}</b>` : ''}</span>` : ''}
      ${a.unanswered ? `<span class="warnline">Не відповіли: ${esc(a.unanswered)}</span>` : ''}
      ${a.next_action ? `<span>Наступна дія: <b>${esc(a.next_action)}</b></span>` : ''}
      ${a.file ? `<span>Файл: ${link(a.file)}</span>` : ''}
      ${a.responsible ? `<span class="muted">Відповідальний: ${esc(a.responsible)}</span>` : ''}
    </div>
    <div class="act-form" hidden></div>
  </div>`;
}

function actionForm(a: Any | null, c: Any) {
  const types = D.actionTypes.map((t) => t.name);
  return `<form class="af">
    ${field('Тип дії *', chips('type', types, a?.type, true), 'Строк відповіді рахується автоматично: ' + D.actionTypes.filter((t) => t.days).map((t) => `${esc(t.name)} — ${t.days} дн.`).join(', '))}
    <div class="g2f">
      ${field('Адресат (орган, посадова особа)', input('addressee', a?.addressee, 'text', 'list="addr"'))}
      ${field('Вих. №', input('out_no', a?.out_no))}
      ${field('Дата дії', input('date', a?.date ?? kyivToday(), 'date'))}
      ${field('Відповідальний', select('responsible', D.responsible, a?.responsible ?? c.responsible))}
    </div>
    ${field('Файл (посилання)', input('file', a?.file, 'url', 'placeholder="Скан у Drive"'))}
    <p class="due muted"></p>
    ${a ? answerFields(a) : ''}
    <div class="wiz-nav"><button type="button" class="btn btn-outline sm" data-do="cancel">Скасувати</button><button class="btn btn-primary sm">${a ? 'Зберегти' : 'Додати дію'}</button></div>
  </form>`;
}

function answerFields(a: Any) {
  return `<fieldset class="ans"><legend>Відповідь</legend>
    <div class="g2f">
      ${field('Дата відповіді', input('answer_date', a.answer_date ?? (a.__answer ? kyivToday() : ''), 'date'))}
      ${field('Вх. № відповіді', input('answer_no', a.answer_no))}
    </div>
    ${field('Оцінка відповіді', chips('rating', D.ratings, a.rating))}
    <div class="poor" ${a.rating && POOR_RATINGS.includes(a.rating) ? '' : 'hidden'}>
      ${field('На що не відповіли', `<textarea name="unanswered" rows="2">${esc(a.unanswered)}</textarea>`)}
      ${field('Наступна дія', chips('next_action', D.nextActions, a.next_action))}
    </div>
  </fieldset>`;
}

function bindActionForm(form: HTMLFormElement, onSave: (data: Any) => Promise<void>, onCancel: () => void) {
  const due = form.querySelector<HTMLElement>('.due')!;
  const upd = () => {
    const d = formData(form);
    const t = D.actionTypes.find((x) => x.name === d.type);
    due.textContent = t?.days && d.date ? `Строк відповіді: ${fd(addDays(d.date, t.days))} (${t.days} дн.)` : t ? 'Для цього типу дії строк відповіді не рахується.' : '';
    const poor = form.querySelector<HTMLElement>('.poor');
    if (poor) poor.hidden = !POOR_RATINGS.includes(d.rating);
  };
  form.addEventListener('change', upd); upd();
  form.querySelector('[data-do=cancel]')!.addEventListener('click', onCancel);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(form);
    if (!d.type) { toast('Оберіть тип дії', true); return; }
    for (const k of ['rating', 'next_action']) if (form.querySelector(`[name=${k}]`) && !(k in d)) d[k] = '';
    await onSave(d);
  });
}

async function caseView(id: string, params: URLSearchParams) {
  const c = await api(`cases/${enc(id)}`);
  const w = canWrite();
  view.innerHTML = `
  <div class="head case-head">
    <a href="#/cases" class="back">← Справи</a>
    <h1>${esc(c.id)}</h1>${statusBadge(c.status)}
    ${c.site_number ? `<span class="muted">з сайту (${esc(c.site_number)})</span>` : ''}
    <span class="grow"></span>
    ${w ? `<label class="inline">Статус ${select('status', D.statuses, c.status, '—')}</label>` : ''}
  </div>
  ${params.get('new') ? `<div class="card ok">Справу створено. Наступний крок — додайте першу дію: лист, звернення, запит чи дзвінок.</div>` : ''}
  <div class="case-grid">
    <div>
      <section class="card">
        <div class="sec-h"><h2>Справа</h2>${w ? '<button class="lnk" id="editCase">Редагувати</button>' : ''}</div>
        <div id="caseInfo">
          <p class="summary">${esc(c.summary || '—')}</p>
          ${c.details ? `<details ${c.source?.includes('сайту') ? 'open' : ''}><summary>Повний текст</summary><p class="pre">${esc(c.details)}</p></details>` : ''}
          <dl class="kv">
            <dt>Ініціатор</dt><dd>${esc(c.initiator || '—')}</dd>
            <dt>Контакт</dt><dd>${esc(c.contact || '—')}</dd>
            <dt>Населений пункт</dt><dd>${esc(c.city || '—')}</dd>
            <dt>Джерело</dt><dd>${esc(c.source || '—')}</dd>
            <dt>Приймальня</dt><dd>${esc(c.office || '—')}</dd>
            <dt>Категорія</dt><dd>${esc(c.category || '—')}</dd>
            <dt>Відкрито</dt><dd>${fd(c.opened)}</dd>
            <dt>Відповідальний</dt><dd>${esc(c.responsible || '—')}</dd>
            ${c.next_step ? `<dt>Наступний крок</dt><dd>${esc(c.next_step)}${c.next_date ? ` · до ${fd(c.next_date)}` : ''}</dd>` : ''}
            ${c.files ? `<dt>Папка / файли</dt><dd>${link(c.files)}</dd>` : ''}
            ${c.attachments?.length ? `<dt>Файли зі звернення</dt><dd>${c.attachments.map((f: Any) => `<a href="/api/journal/cases/${encodeURIComponent(c.id)}/files/${encodeURIComponent(f.id)}">${esc(f.name)}</a> <span class="muted">${Math.max(1, Math.round(f.size / 1024))} КБ</span>`).join('<br>')}</dd>` : ''}
            ${c.result ? `<dt>Результат</dt><dd>${esc(c.result)}</dd>` : ''}
            ${c.closed ? `<dt>Закрито</dt><dd>${fd(c.closed)}</dd>` : ''}
          </dl>
        </div>
        <form id="caseForm" hidden>${caseFields(c)}<div class="wiz-nav">${isAdmin() ? '<button type="button" class="lnk red" id="delCase">Видалити справу</button><span class="grow"></span>' : ''}<button type="button" class="btn btn-outline sm" id="cancelCase">Скасувати</button><button class="btn btn-primary sm">Зберегти</button></div></form>
      </section>
      <section class="card">
        <div class="sec-h"><h2>Дії <span class="muted">${c.actions.length || ''}</span></h2>${w ? '<button class="btn btn-primary sm" id="addAct">+ Дія</button>' : ''}</div>
        <div id="newAct" hidden></div>
        <div class="acts">${c.actions.map(actionCard).join('') || '<p class="muted">Дій ще немає.</p>'}</div>
      </section>
    </div>
    <div>
      <section class="card">
        <h2>Нотатки</h2>
        <form id="noteForm" class="note-form"><textarea name="text" rows="2" placeholder="Коментар для команди…" required></textarea><button class="btn btn-primary sm">Додати</button></form>
        <div class="notes">${c.notes.map((n: Any) => `<div class="note"><small class="muted">${esc(n.author || n.email)} · ${fdt(n.ts)}</small><p class="pre">${esc(n.text)}</p></div>`).join('') || '<p class="muted">Нотаток немає.</p>'}</div>
      </section>
      <section class="card"><details><summary><b>Історія змін</b></summary>
        <ul class="hist">${c.history.map((h: Any) => `<li><small class="muted">${fdt(h.ts)} · ${esc(h.email === 'site' ? 'форма сайту' : (PEOPLE.find((p) => p.email === h.email)?.name ?? h.email))}</small><br>${esc({ create: 'створено', update: 'змінено', delete: 'видалено' }[h.op as string] ?? h.op)} ${h.entity === 'action' ? 'дію' : 'справу'} ${esc(histDetails(h.details))}</li>`).join('')}</ul>
      </details></section>
    </div>
  </div>
  <datalist id="addr">${[...new Set(c.actions.map((a: Any) => a.addressee).filter(Boolean))].map((a) => `<option value="${esc(a)}">`).join('')}</datalist>`;

  const reload = () => caseView(id, new URLSearchParams());
  const save = async (fn: () => Promise<unknown>, msg = 'Збережено') => { try { await fn(); toast(msg); await reload(); } catch (e) { toast((e as Error).message, true); } };

  view.querySelector<HTMLSelectElement>('.case-head select[name=status]')?.addEventListener('change', (e) => {
    const status = (e.target as HTMLSelectElement).value;
    if (status) save(() => api(`cases/${enc(id)}`, 'PATCH', { status }), `Статус: ${status}`);
  });
  const cf = document.getElementById('caseForm') as HTMLFormElement;
  document.getElementById('editCase')?.addEventListener('click', () => { cf.hidden = false; document.getElementById('caseInfo')!.hidden = true; });
  document.getElementById('cancelCase')?.addEventListener('click', () => { cf.hidden = true; document.getElementById('caseInfo')!.hidden = false; });
  cf.addEventListener('submit', (e) => { e.preventDefault(); save(() => api(`cases/${enc(id)}`, 'PATCH', formData(cf))); });
  document.getElementById('delCase')?.addEventListener('click', async () => {
    if (prompt(`Справу буде видалено разом з усіма діями. Щоб підтвердити, введіть її номер: ${id}`)?.trim().toUpperCase() !== id) return;
    try { await api(`cases/${enc(id)}`, 'DELETE'); toast('Справу видалено'); location.hash = '#/cases'; } catch (e) { toast((e as Error).message, true); }
  });

  const na = document.getElementById('newAct')!;
  document.getElementById('addAct')?.addEventListener('click', () => {
    na.hidden = false; na.innerHTML = actionForm(null, c);
    bindActionForm(na.querySelector('form')!, (d) => save(() => api(`cases/${enc(id)}/actions`, 'POST', d), 'Дію додано'), () => { na.hidden = true; });
    na.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  view.querySelectorAll<HTMLElement>('.act').forEach((el) => {
    const a = c.actions.find((x: Any) => String(x.id) === el.dataset.id);
    const box = el.querySelector<HTMLElement>('.act-form')!;
    el.querySelector('[data-do=answer]')?.addEventListener('click', () => {
      box.hidden = false;
      box.innerHTML = `<form class="af">${answerFields({ ...a, __answer: true })}<div class="wiz-nav"><button type="button" class="btn btn-outline sm" data-do="cancel">Скасувати</button><button class="btn btn-primary sm">Зберегти відповідь</button></div></form>`;
      const f = box.querySelector('form')!;
      const upd = () => { f.querySelector<HTMLElement>('.poor')!.hidden = !POOR_RATINGS.includes(formData(f).rating); };
      f.addEventListener('change', upd);
      f.querySelector('[data-do=cancel]')!.addEventListener('click', () => { box.hidden = true; });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(f);
        if (!d.answer_date && d.rating !== 'Немає відповіді') { toast('Вкажіть дату відповіді', true); return; }
        save(() => api(`actions/${a.id}`, 'PATCH', d), 'Відповідь записано');
      });
    });
    el.querySelector('[data-do=edit]')?.addEventListener('click', () => {
      box.hidden = false; box.innerHTML = actionForm(a, c);
      bindActionForm(box.querySelector('form')!, (d) => save(() => api(`actions/${a.id}`, 'PATCH', d)), () => { box.hidden = true; });
    });
    el.querySelector('[data-do=del]')?.addEventListener('click', () => {
      if (confirm('Видалити цю дію?')) save(() => api(`actions/${a.id}`, 'DELETE'), 'Дію видалено');
    });
  });

  const nf = document.getElementById('noteForm') as HTMLFormElement;
  nf.addEventListener('submit', (e) => { e.preventDefault(); const t = formData(nf).text; if (t) save(() => api(`cases/${enc(id)}/notes`, 'POST', { text: t }), 'Нотатку додано'); });
}

function histDetails(raw: string) {
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return '';
    const names: Record<string, string> = { status: 'статус', responsible: 'відповідальний', type: 'тип', addressee: 'адресат', rating: 'оцінка', answer_date: 'дата відповіді' };
    return Object.entries(d).filter(([k]) => k in names).map(([k, v]) => `${names[k]}: ${v ?? '—'}`).join(', ');
  } catch { return ''; }
}

// ---------- команда ----------
async function teamView() {
  const [users, sheet] = await Promise.all([api<Any[]>('users'), api<Any>('sheet-link')]);
  const roleName: Record<string, string> = { admin: 'Координатор (усе, включно з командою)', assistant: 'Помічник (веде справи)', viewer: 'Перегляд (дашборд і справи)' };
  const form = (u: Any = {}) => `<form class="uf g2f">
    ${field('Email *', input('email', u.email, 'email', `required ${u.email ? 'readonly' : ''}`))}
    ${field('Ім\'я (як у «Відповідальний»)', select('name', D.responsible, u.name, 'Оберіть…'))}
    ${field('Роль', `<select name="role">${Object.entries(roleName).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
    ${field('Контакт для громадян', input('public_contact', u.public_contact, 'text', 'placeholder="телефон або email, показується у перевірці статусу на сайті"'))}
    ${field('Активний', `<select name="active"><option value="1">так</option><option value="0" ${u.active === 0 ? 'selected' : ''}>ні (доступ закрито)</option></select>`)}
    <div class="wiz-nav span2"><button class="btn btn-primary sm">${u.email ? 'Зберегти' : 'Додати до команди'}</button></div>
  </form>`;
  view.innerHTML = `
  <div class="head"><h1>Команда</h1></div>
  <p class="muted">Тут визначається, хто має доступ до журналу. Людина входить на kamelchuk.org/journal зі своїм email і кодом з пошти. Якщо email не в цьому списку або вимкнений — доступу немає.</p>
  <section class="card"><h2>Додати людину</h2>${form()}</section>
  <section class="card" id="sheetCard"><h2>Копія в Google-таблицю</h2>
    <p class="muted">Таблиця «📥 ЖУРНАЛ. Камельчук» сама забирає справи й дії з журналу (Google оновлює приблизно щогодини). ${sheet.enabled ? `Посилання створено ${esc(String(sheet.created ?? '').slice(0, 16).replace('T', ' '))} UTC${sheet.last_fetch ? `, таблиця востаннє забирала дані ${esc(String(sheet.last_fetch).slice(0, 16).replace('T', ' '))} UTC` : ', таблиця ще не забирала дані'}.` : 'Посилання ще не створено.'}</p>
    <div id="sheetOut"></div>
    <div class="wiz-nav"><button type="button" class="btn btn-primary sm" id="sheetNew">${sheet.enabled ? 'Створити нове посилання (старе перестане працювати)' : 'Створити посилання'}</button>${sheet.enabled ? '<button type="button" class="lnk red" id="sheetDrop">Вимкнути копію</button>' : ''}</div>
  </section>
  <section class="card"><h2>У команді <span class="muted">${users.length}</span></h2>
    <div class="users">${users.map((u) => `<details class="user"><summary><b>${esc(u.name)}</b> <span class="muted">${esc(u.email)}</span> <span class="badge ${u.active ? 'st-work' : 'st-closed'}">${esc(roleName[u.role]?.split(' (')[0] ?? u.role)}${u.active ? '' : ' · вимкнено'}</span></summary>${form(u)}</details>`).join('') || '<p class="muted">Поки нікого не додано. Координатори з налаштувань (JOURNAL_ADMINS) мають доступ завжди.</p>'}</div>
  </section>`;
  const SHEET = 'https://docs.google.com/spreadsheets/d/1mpo_26goAwjnSE8ILwKFmVp8_1qYOh_DT8Rew-JEmJY/edit';
  view.querySelector('#sheetNew')?.addEventListener('click', async () => {
    try {
      const r = await api<Any>('sheet-link', 'POST');
      const row = (name: string, url: string) => {
        const f = `=IMPORTDATA("${url}")`;
        return `<p><b>Аркуш «${name}»</b>, клітинка A1 (аркуш має бути порожнім):</p><div class="filters"><input readonly value="${esc(f)}" onclick="this.select()"><button type="button" class="btn btn-outline sm" data-copy="${esc(f)}">Копіювати</button></div>`;
      };
      view.querySelector('#sheetOut')!.innerHTML = `${row('Справи', r.cases)}${row('Дії', r.actions)}
        <p class="muted">Посилання з ключем показано лише зараз. Нікому його не пересилайте: хто має формулу, бачить усі справи. <a href="${SHEET}" target="_blank" rel="noopener">Відкрити таблицю ↗</a></p>`;
      view.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => { await navigator.clipboard.writeText(b.dataset.copy!); toast('Скопійовано'); }));
    } catch (err) { toast((err as Error).message, true); }
  });
  view.querySelector('#sheetDrop')?.addEventListener('click', async () => {
    if (!confirm('Вимкнути копію в таблицю? Формули в таблиці перестануть оновлюватися.')) return;
    try { await api('sheet-link', 'DELETE'); toast('Копію вимкнено'); teamView(); } catch (err) { toast((err as Error).message, true); }
  });
  view.querySelectorAll<HTMLFormElement>('.uf').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(f);
    try { await api('users', 'POST', { ...d, name: d.name || d.email, active: Number(d.active ?? 1), offices: '' }); toast('Збережено'); teamView(); } catch (err) { toast((err as Error).message, true); }
  }));
}

// ---------- довідники ----------
function dictsView() {
  const lists: [keyof Dicts, string, string][] = [
    ['sources', 'Джерело', ''], ['offices', 'Приймальня', ''], ['categories', 'Категорія', ''], ['statuses', 'Статус справи', 'Статуси «Вирішено», «Частково вирішено», «Не вирішено», «Закрито» вважаються закритими.'],
    ['responsible', 'Відповідальний', ''], ['actionTypes', 'Тип дії | днів на відповідь', 'Формат: «Назва | 10». Без числа — строк не рахується (дзвінок, зустріч).'],
    ['ratings', 'Оцінка відповіді', '«Неповна», «Формальна (відписка)», «Відмова», «Немає відповіді» позначаються 🟠.'], ['nextActions', 'Наступна дія', ''],
  ];
  view.innerHTML = `<div class="head"><h1>Довідники</h1></div>
  <p class="muted">Значення з'являються у виборі під час заповнення справ і дій. Одне значення — один рядок. Строки відповідей ще треба звірити з юристом.</p>
  <div class="grid2">${lists.map(([k, title, hint]) => `<form class="card df" data-k="${k}"><h2>${title}</h2>
    <textarea name="items" rows="${Math.max(5, (D[k] as unknown[]).length + 1)}">${esc(k === 'actionTypes' ? D.actionTypes.map((t) => `${t.name}${t.days ? ` | ${t.days}` : ''}`).join('\n') : (D[k] as string[]).join('\n'))}</textarea>
    ${hint ? `<small class="muted">${hint}</small>` : ''}<div class="wiz-nav"><button class="btn btn-primary sm">Зберегти</button></div></form>`).join('')}</div>`;
  view.querySelectorAll<HTMLFormElement>('.df').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = f.dataset.k as keyof Dicts;
    const lines = formData(f).items.split('\n').map((s) => s.trim()).filter(Boolean);
    const items = k === 'actionTypes' ? lines.map((l) => { const [n, d] = l.split('|').map((s) => s.trim()); return { name: n, days: Number(d) > 0 ? Number(d) : null }; }) : lines;
    try { D = await api<Dicts>(`dicts/${k}`, 'PUT', { items }); toast('Довідник збережено'); } catch (err) { toast((err as Error).message, true); }
  }));
}

// ---------- інструкція ----------
function helpView(params: URLSearchParams) {
  view.innerHTML = HELP_HTML;
  const go = (s: string | null) => { if (s) document.getElementById(`h-${s}`)?.scrollIntoView({ behavior: 'smooth' }); };
  view.querySelectorAll<HTMLAnchorElement>('.toc a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')!); go(a.dataset.s!); }));
  setTimeout(() => go(params.get('s')), 50);
}

// ---------- старт ----------
(async () => {
  try {
    const b = await api<{ user: Me; dicts: Dicts; users: { name: string; email: string }[] }>('me');
    ME = b.user; D = b.dicts; PEOPLE = b.users;
    document.body.classList.add('ready');
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    view.innerHTML = `<div class="card err">Немає доступу: ${esc((e as Error).message)}. <a href="/cdn-cgi/access/logout">Увійти знову</a></div>`;
  }
})();

