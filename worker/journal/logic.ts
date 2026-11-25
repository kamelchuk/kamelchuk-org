// Спільна логіка журналу для Worker і браузера: строки й стан дії (як формули аркуша «Дії»).
export interface ActionRow {
  id: number; case_id: string; date: string | null; type: string | null; due: string | null;
  answer_date: string | null; rating: string | null; [k: string]: unknown;
}
export type ActionStateKey = 'full' | 'react' | 'answered' | 'none' | 'overdue' | 'soon' | 'wait';

export const STATE_LABEL: Record<ActionStateKey, string> = {
  full: '✅ Повна відповідь',
  react: '🟠 Потрібна реакція',
  answered: '🟢 Відповідь отримана',
  none: '—',
  overdue: '🔴 Прострочено',
  soon: '🟡 Строк спливає',
  wait: '⏳ Очікуємо',
};
export const POOR_RATINGS = ['Неповна', 'Формальна (відписка)', 'Відмова', 'Немає відповіді'];

export function kyivToday(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function addDays(iso: string, days: number) {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export function actionState(a: Pick<ActionRow, 'due' | 'answer_date' | 'rating'>, today: string): { state: ActionStateKey; state_label: string; days_left: number | null } {
  let state: ActionStateKey;
  if (a.rating === 'Повна') state = 'full';
  else if (a.rating && POOR_RATINGS.includes(a.rating)) state = 'react';
  else if (a.answer_date) state = 'answered';
  else if (!a.due) state = 'none';
  else if (a.due < today) state = 'overdue';
  else if (daysBetween(today, a.due) <= 3) state = 'soon';
  else state = 'wait';
  const days_left = a.due && !a.answer_date ? daysBetween(today, a.due) : null;
  return { state, state_label: STATE_LABEL[state], days_left };
}

export const CLOSED_STATUSES = ['Вирішено', 'Частково вирішено', 'Не вирішено', 'Закрито'];

/** Статус для громадянина на сайті (/api/status): received | in_progress | answered. */
export function publicStatus(caseStatus: string | null | undefined) {
  if (!caseStatus || caseStatus === 'Нова') return 'received';
  return CLOSED_STATUSES.includes(caseStatus) ? 'answered' : 'in_progress';
}
