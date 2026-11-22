// Спільні хелпери для Cloudflare Functions сайту kamelchuk.org.ua.
export interface Env {
  JOINS: KVNamespace;                 // KV: лічильник і заявки
  TELEGRAM_BOT_TOKEN?: string;        // бот для сповіщень
  TELEGRAM_CHAT_IDS?: string;         // id чатів через кому (Юлія Бондар, Олег)
  SHEETS_WEBHOOK_URL?: string;        // Google Apps Script, що дописує рядок у таблицю заявок
  RESEND_API_KEY?: string;            // відправка email
  MAIL_FROM?: string;                 // напр. "Команда Камельчука <komanda@kamelchuk.org.ua>"
  MAIL_TO?: string;                   // komanda@kamelchuk.org.ua
  TEAM_CHAT_URL?: string;             // запрошення до загального Telegram-чату команди
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export function kyivNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { year: g('year'), month: g('month'), stamp: `${g('day')}.${g('month')}.${g('year')} ${g('hour')}:${g('minute')}` };
}

// Номер заявки: K{порядковий у місяці}-{місяць}-{рік}, напр. K1-11-2026
export async function nextNumber(kv: KVNamespace) {
  const { year, month } = kyivNow();
  const key = `counter:${year}-${month}`;
  const n = Number((await kv.get(key)) ?? '0') + 1;
  await kv.put(key, String(n));
  return `K${n}-${Number(month)}-${year}`;
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
