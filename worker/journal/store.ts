// Журнал приймальні (CRM): справи, дії, нотатки, команда, довідники.
// Дані в SQLite усередині Durable Object JournalStore (один екземпляр «journal»).
// Схема повторює Google-таблицю «📥 ЖУРНАЛ. Камельчук» (аркуші «Справи», «Дії», «Довідники»).
import { DurableObject } from 'cloudflare:workers';
import { DEFAULT_DICTS, type Dicts } from './dicts';
import { actionState, kyivToday, addDays, type ActionRow } from './logic';

export type Role = 'admin' | 'assistant' | 'viewer';
export interface User { email: string; name: string; role: Role; offices: string; active: number }

export const CASE_FIELDS = [
  'opened', 'source', 'initiator', 'contact', 'city', 'office', 'category', 'summary', 'details',
  'responsible', 'status', 'next_step', 'next_date', 'result', 'closed', 'files', 'site_number',
] as const;
export const ACTION_FIELDS = [
  'date', 'type', 'addressee', 'out_no', 'answer_date', 'answer_no', 'rating', 'unanswered', 'next_action', 'file', 'responsible',
] as const;

const CLOSED = ['Вирішено', 'Частково вирішено', 'Не вирішено', 'Закрито'];
type Row = Record<string, string | number | null>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY, year INTEGER NOT NULL, seq INTEGER NOT NULL,
  opened TEXT, source TEXT, initiator TEXT, contact TEXT, city TEXT, office TEXT, category TEXT,
  summary TEXT, details TEXT, responsible TEXT, status TEXT, next_step TEXT, next_date TEXT,
  result TEXT, closed TEXT, files TEXT, site_number TEXT,
  created_by TEXT, created_at TEXT, updated_at TEXT
);
CREATE INDEX IF NOT EXISTS cases_year ON cases(year, seq);
CREATE INDEX IF NOT EXISTS cases_site ON cases(site_number);
CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL,
  date TEXT, type TEXT, addressee TEXT, out_no TEXT, days INTEGER, due TEXT,
  answer_date TEXT, answer_no TEXT, rating TEXT, unanswered TEXT, next_action TEXT, file TEXT, responsible TEXT,
  created_by TEXT, created_at TEXT, updated_at TEXT
);
CREATE INDEX IF NOT EXISTS actions_case ON actions(case_id);
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, ts TEXT, email TEXT, author TEXT, text TEXT);
CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, name TEXT, role TEXT, offices TEXT DEFAULT '', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS dicts (name TEXT PRIMARY KEY, items TEXT);
CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT, entity TEXT, entity_id TEXT, op TEXT, details TEXT);
`;

const nowIso = () => new Date().toISOString();
const clean = (v: unknown) => (v === undefined || v === null ? null : String(v).trim().slice(0, 20000) || null);

export class JournalStore extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as never);
    ctx.blockConcurrencyWhile(async () => { this.ctx.storage.sql.exec(SCHEMA); });
  }

  private q<T = Row>(sql: string, ...args: unknown[]): T[] {
    return this.ctx.storage.sql.exec(sql, ...args).toArray() as T[];
  }
  private log(email: string, entity: string, id: string, op: string, details: unknown) {
    this.q('INSERT INTO log (ts, email, entity, entity_id, op, details) VALUES (?, ?, ?, ?, ?, ?)', nowIso(), email, entity, id, op, JSON.stringify(details ?? null).slice(0, 4000));
  }

  // ---------- команда ----------
  async getUser(email: string): Promise<User | null> {
    return this.q<User>('SELECT * FROM users WHERE email = ?', email.toLowerCase())[0] ?? null;
  }
  async listUsers() { return this.q<User>('SELECT * FROM users ORDER BY active DESC, name'); }
  async saveUser(by: string, u: Partial<User>) {
    const email = String(u.email ?? '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('bad email');
    const role: Role = (['admin', 'assistant', 'viewer'] as const).includes(u.role as Role) ? (u.role as Role) : 'assistant';
    this.q(`INSERT INTO users (email, name, role, offices, active) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, offices = excluded.offices, active = excluded.active`,
      email, clean(u.name) ?? email, role, clean(u.offices) ?? '', u.active === 0 ? 0 : 1);
    this.log(by, 'user', email, 'save', { role, offices: u.offices, active: u.active });
    return this.getUser(email);
  }

  // ---------- довідники ----------
  async getDicts(): Promise<Dicts> {
    const rows = this.q<{ name: string; items: string }>('SELECT name, items FROM dicts');
    const d: Dicts = structuredClone(DEFAULT_DICTS);
    for (const r of rows) try { (d as unknown as Record<string, unknown>)[r.name] = JSON.parse(r.items); } catch { /* лишаємо типові */ }
    return d;
  }
  async saveDict(by: string, name: string, items: unknown) {
    if (!(name in DEFAULT_DICTS)) throw new Error('bad dict');
    if (!Array.isArray(items)) throw new Error('bad items');
    this.q('INSERT INTO dicts (name, items) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET items = excluded.items', name, JSON.stringify(items));
    this.log(by, 'dict', name, 'save', items);
    return this.getDicts();
  }

  // ---------- справи ----------
  private async daysFor(type: string | null) {
    if (!type) return null;
    const t = (await this.getDicts()).actionTypes.find((x) => x.name === type);
    return t && t.days ? t.days : null;
  }

  async createCase(by: string, data: Row) {
    const opened = /^\d{4}-\d{2}-\d{2}$/.test(String(data.opened ?? '')) ? String(data.opened) : kyivToday();
    const year = Number(opened.slice(0, 4));
    const seq = (this.q<{ n: number }>('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM cases WHERE year = ?', year)[0]?.n) ?? 1;
    const id = `КЗ-${year}-${String(seq).padStart(4, '0')}`;
    const vals = CASE_FIELDS.map((f) => (f === 'opened' ? opened : clean(data[f])));
    const status = clean(data.status) ?? 'Нова';
    vals[CASE_FIELDS.indexOf('status')] = status;
    const ts = nowIso();
    this.q(`INSERT INTO cases (id, year, seq, ${CASE_FIELDS.join(', ')}, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ${CASE_FIELDS.map(() => '?').join(', ')}, ?, ?, ?)`, id, year, seq, ...vals, by, ts, ts);
    this.log(by, 'case', id, 'create', { source: data.source, office: data.office });
    return this.getCase(id);
  }

  async updateCase(by: string, id: string, data: Row) {
    const old = this.q('SELECT * FROM cases WHERE id = ?', id)[0];
    if (!old) return null;
    const fields = CASE_FIELDS.filter((f) => f in data);
    if (!fields.length) return this.getCase(id);
    const patch: Row = {};
    for (const f of fields) patch[f] = clean(data[f]);
    // Закрили справу — ставимо дату закриття, якщо її не вказали.
    if (patch.status && CLOSED.includes(String(patch.status)) && !old.closed && !('closed' in patch)) { patch.closed = kyivToday(); fields.push('closed'); }
    if (patch.status && !CLOSED.includes(String(patch.status)) && old.closed && !('closed' in data)) { patch.closed = null; fields.push('closed'); }
    this.q(`UPDATE cases SET ${fields.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`, ...fields.map((f) => patch[f]), nowIso(), id);
    const diff: Row = {};
    for (const f of fields) if ((old[f] ?? null) !== (patch[f] ?? null)) diff[f] = f === 'details' || f === 'contact' ? '…' : patch[f];
    this.log(by, 'case', id, 'update', diff);
    return this.getCase(id);
  }

  async deleteCase(by: string, id: string) {
    this.q('DELETE FROM actions WHERE case_id = ?', id);
    this.q('DELETE FROM notes WHERE case_id = ?', id);
    this.q('DELETE FROM cases WHERE id = ?', id);
    this.log(by, 'case', id, 'delete', null);
    return true;
  }

  async getCase(id: string) {
    const c = this.q('SELECT * FROM cases WHERE id = ?', id)[0];
    if (!c) return null;
    const today = kyivToday();
    const actions = this.q<ActionRow>('SELECT * FROM actions WHERE case_id = ? ORDER BY date, id', id).map((a) => ({ ...a, ...actionState(a, today) }));
    const notes = this.q('SELECT * FROM notes WHERE case_id = ? ORDER BY id DESC', id);
    const history = this.q('SELECT ts, email, op, entity, details FROM log WHERE entity_id = ? ORDER BY id DESC LIMIT 100', id);
    return { ...c, actions, notes, history };
  }

  /** Лише статус — для публічної перевірки на сайті, без персональних даних. */
  async getCaseStatus(id: string) {
    return this.q<{ status: string }>('SELECT status FROM cases WHERE id = ?', id)[0] ?? null;
  }

  async caseBySiteNumber(n: string) {
    return this.q('SELECT id, status FROM cases WHERE site_number = ?', n)[0] ?? null;
  }

  /** Усі справи з підсумками дій — для списку, дашборду й експорту. */
  async listCases(offices: string[] = []) {
    const today = kyivToday();
    const cases = offices.length
      ? this.q(`SELECT * FROM cases WHERE office IN (${offices.map(() => '?').join(',')}) ORDER BY year DESC, seq DESC`, ...offices)
      : this.q('SELECT * FROM cases ORDER BY year DESC, seq DESC');
    const ids = new Set(cases.map((c) => c.id));
    const actions = this.q<ActionRow>('SELECT * FROM actions ORDER BY date, id')
      .filter((a) => ids.has(a.case_id))
      .map((a) => ({ ...a, ...actionState(a, today) }));
    const by = new Map<string, typeof actions>();
    for (const a of actions) (by.get(a.case_id) ?? by.set(a.case_id, []).get(a.case_id)!).push(a);
    const list = cases.map((c) => {
      const acts = by.get(String(c.id)) ?? [];
      const open = acts.filter((a) => a.due && !a.answer_date).map((a) => String(a.due)).sort();
      return {
        ...c, details: undefined,
        actions_count: acts.length,
        overdue: acts.filter((a) => a.state === 'overdue').length,
        soon: acts.filter((a) => a.state === 'soon').length,
        react: acts.filter((a) => a.state === 'react').length,
        next_due: open[0] ?? null,
      };
    });
    return { cases: list, actions, today };
  }

  // ---------- дії ----------
  async addAction(by: string, caseId: string, data: Row) {
    if (!this.q('SELECT id FROM cases WHERE id = ?', caseId)[0]) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(data.date ?? '')) ? String(data.date) : kyivToday();
    const days = await this.daysFor(clean(data.type));
    const due = days ? addDays(date, days) : null;
    const vals = ACTION_FIELDS.map((f) => (f === 'date' ? date : clean(data[f])));
    const ts = nowIso();
    this.q(`INSERT INTO actions (case_id, ${ACTION_FIELDS.join(', ')}, days, due, created_by, created_at, updated_at)
            VALUES (?, ${ACTION_FIELDS.map(() => '?').join(', ')}, ?, ?, ?, ?, ?)`, caseId, ...vals, days, due, by, ts, ts);
    // Відправили лист з очікуваною відповіддю — справа переходить у «Очікуємо відповідь».
    const c = this.q('SELECT status FROM cases WHERE id = ?', caseId)[0];
    if (due && (c?.status === 'Нова' || c?.status === 'В роботі')) this.q('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?', 'Очікуємо відповідь', ts, caseId);
    else this.q('UPDATE cases SET updated_at = ? WHERE id = ?', ts, caseId);
    this.log(by, 'action', caseId, 'create', { case_id: caseId, type: data.type, addressee: data.addressee });
    return this.getCase(caseId);
  }

  async updateAction(by: string, id: number, data: Row) {
    const old = this.q<ActionRow>('SELECT * FROM actions WHERE id = ?', id)[0];
    if (!old) return null;
    const fields = ACTION_FIELDS.filter((f) => f in data);
    const patch: Row = {};
    for (const f of fields) patch[f] = clean(data[f]);
    const type = 'type' in patch ? patch.type : old.type;
    const date = 'date' in patch ? patch.date : old.date;
    const days = await this.daysFor(type ? String(type) : null);
    const due = days && date ? addDays(String(date), days) : null;
    this.q(`UPDATE actions SET ${fields.map((f) => `${f} = ?`).join(', ')}${fields.length ? ',' : ''} days = ?, due = ?, updated_at = ? WHERE id = ?`,
      ...fields.map((f) => patch[f]), days, due, nowIso(), id);
    this.q('UPDATE cases SET updated_at = ? WHERE id = ?', nowIso(), old.case_id);
    this.log(by, 'action', old.case_id, 'update', { case_id: old.case_id, action: id, ...patch });
    return this.getCase(String(old.case_id));
  }

  async deleteAction(by: string, id: number) {
    const old = this.q<ActionRow>('SELECT case_id FROM actions WHERE id = ?', id)[0];
    if (!old) return null;
    this.q('DELETE FROM actions WHERE id = ?', id);
    this.log(by, 'action', old.case_id, 'delete', { case_id: old.case_id, action: id });
    return this.getCase(String(old.case_id));
  }

  // ---------- нотатки ----------
  async addNote(by: string, author: string, caseId: string, text: string) {
    const t = clean(text);
    if (!t || !this.q('SELECT id FROM cases WHERE id = ?', caseId)[0]) return null;
    this.q('INSERT INTO notes (case_id, ts, email, author, text) VALUES (?, ?, ?, ?, ?)', caseId, nowIso(), by, author, t);
    return this.getCase(caseId);
  }

  async recentLog(limit = 200) { return this.q('SELECT * FROM log ORDER BY id DESC LIMIT ?', limit); }
}
