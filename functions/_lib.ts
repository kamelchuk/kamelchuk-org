// Спільні хелпери для Cloudflare Pages Functions.
export interface Env {
  APPEALS: KVNamespace;               // KV: лічильники і статуси звернень
  TELEGRAM_BOT_TOKEN?: string;        // бот для сповіщень
  TELEGRAM_CHAT_IDS?: string;         // id чатів через кому (Юрій, Юлія Бондар)
  SHEETS_WEBHOOK_URL?: string;        // Google Apps Script, що дописує рядок у таблицю
  RESEND_API_KEY?: string;            // відправка email (офіс + автовідповідь)
  MAIL_FROM?: string;                 // напр. "Приймальня Юрія Камельчука <zvernennia@kamelchuk.org>"
  MAIL_TO?: string;                   // скринька приймальні, zvernennia@kamelchuk.org
  ADMIN_TOKEN?: string;               // для зміни статусу
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// Дата за київським часом
export function kyivNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { year: g('year'), month: g('month'), stamp: `${g('day')}.${g('month')}.${g('year')} ${g('hour')}:${g('minute')}` };
}

// Номер звернення: S{порядковий у місяці}-{місяць}-{рік}, напр. S1-11-2026
export async function nextNumber(kv: KVNamespace) {
  const { year, month } = kyivNow();
  const key = `counter:${year}-${month}`;
  const n = Number((await kv.get(key)) ?? '0') + 1;
  await kv.put(key, String(n));
  return `S${n}-${Number(month)}-${year}`;
}

export const STATUSES = ['received', 'in_progress', 'answered'] as const;

export const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
