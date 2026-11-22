import { type Env, json, kyivNow, nextNumber, esc } from '../_lib';

const REQUIRED = ['name', 'phone', 'email', 'region', 'city', 'topic', 'text', 'consent'];
const MAX_FILES_BYTES = 10 * 1024 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const fd = await request.formData();
  const v = (k: string) => String(fd.get(k) ?? '').trim();
  for (const k of REQUIRED) if (!v(k)) return json({ error: `missing ${k}` }, 400);
  const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.reduce((s, f) => s + f.size, 0) > MAX_FILES_BYTES) return json({ error: 'files too large' }, 413);

  const number = await nextNumber(env.APPEALS);
  const { stamp } = kyivNow();
  const a = { number, date: stamp, status: 'received', name: v('name'), phone: v('phone'), email: v('email'), region: v('region'), city: v('city'), topic: v('topic'), text: v('text'), lang: v('lang') || 'uk', files: files.map((f) => f.name) };
  await env.APPEALS.put(`appeal:${number}`, JSON.stringify(a));

  const summary = `Звернення ${number}\n${a.date}\n\n${a.name}\n${a.phone} · ${a.email}\n${a.region} обл., ${a.city}\nТема: ${a.topic}\n\n${a.text}`;
  const jobs: Promise<unknown>[] = [];

  // 1) Telegram: Юрій і Юлія Бондар
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_IDS) {
    for (const chat of env.TELEGRAM_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)) {
      jobs.push(fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: summary.slice(0, 4000) }),
      }));
      for (const f of files) {
        const body = new FormData(); body.append('chat_id', chat); body.append('caption', number); body.append('document', f, f.name);
        jobs.push(fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body }));
      }
    }
  }
  // 2) Google Таблиця
  if (env.SHEETS_WEBHOOK_URL) {
    jobs.push(fetch(env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) }));
  }
  // 3) Email у приймальню + автовідповідь заявнику
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    const attachments = await Promise.all(files.map(async (f) => ({ filename: f.name, content: btoa(String.fromCharCode(...new Uint8Array(await f.arrayBuffer()))) })));
    const send = (payload: object) => fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (env.MAIL_TO) jobs.push(send({ from: env.MAIL_FROM, to: env.MAIL_TO, reply_to: a.email, subject: `Звернення ${number}: ${a.topic}`, text: summary, attachments }));
    const uk = a.lang !== 'en';
    jobs.push(send({
      from: env.MAIL_FROM, to: a.email,
      subject: uk ? `Ваше звернення ${number} отримано` : `Your appeal ${number} has been received`,
      html: uk
        ? `<p>Шановна(ий) ${esc(a.name)}!</p><p>Ваше звернення отримано і зареєстровано за номером <b>${number}</b>.</p><p>Статус можна перевірити на сайті: <a href="https://kamelchuk.org/zvernennia/">kamelchuk.org/zvernennia</a>.</p><p>Приймальня народного депутата України Юрія Камельчука</p>`
        : `<p>Dear ${esc(a.name)},</p><p>Your appeal has been received and registered under number <b>${number}</b>.</p><p>You can check its status at <a href="https://kamelchuk.org/en/appeal/">kamelchuk.org/en/appeal</a>.</p><p>Office of MP Yurii Kamelchuk</p>`,
    }));
  }
  await Promise.allSettled(jobs);
  return json({ number });
};
