import { type Env, json, kyivNow, nextNumber, esc } from '../_lib';

const REQUIRED = ['name', 'phone', 'email', 'age', 'region', 'city', 'status', 'pillar', 'docs', 'consent'];

// Заявка «Долучитися»: номер, KV, Telegram (Юлія Бондар, Олег), Google Таблиця, email команді та лист заявнику з документами.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const fd = await request.formData();
  const v = (k: string) => String(fd.get(k) ?? '').trim().slice(0, 4000);
  for (const k of REQUIRED) if (!v(k)) return json({ error: `missing ${k}` }, 400);

  const number = await nextNumber(env.JOINS);
  const { stamp } = kyivNow();
  const a = {
    number, date: stamp, name: v('name'), phone: v('phone'), email: v('email'), telegram: v('telegram'),
    age: v('age'), region: v('region'), city: v('city'), status: v('status'), pillar: v('pillar'),
    directions: fd.getAll('directions').map(String).join(', '), help: v('help'), lang: v('lang') || 'uk',
  };
  await env.JOINS.put(`join:${number}`, JSON.stringify(a));

  const summary = `Заявка ${number} · ${a.date}\n\n${a.name}, ${a.age} р.\n${a.phone} · ${a.email}${a.telegram ? ' · ' + a.telegram : ''}\n${a.region}, ${a.city}\nСтатус: ${a.status}\nНапрям: ${a.pillar}${a.directions ? '\nПроєкти: ' + a.directions : ''}${a.help ? '\n\nЧим може допомогти: ' + a.help : ''}`;
  const jobs: Promise<unknown>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_IDS) {
    for (const chat of env.TELEGRAM_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)) {
      jobs.push(fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: summary }),
      }));
    }
  }
  if (env.SHEETS_WEBHOOK_URL) {
    jobs.push(fetch(env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) }));
  }
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    const send = (payload: object) => fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (env.MAIL_TO) jobs.push(send({ from: env.MAIL_FROM, to: env.MAIL_TO, reply_to: a.email, subject: `Заявка ${number}: ${a.status}, ${a.region}`, text: summary }));
    const uk = a.lang !== 'en';
    const chat = env.TEAM_CHAT_URL ? (uk ? `<p>Запрошуємо до чату команди: <a href="${env.TEAM_CHAT_URL}">${env.TEAM_CHAT_URL}</a></p>` : `<p>Join the team chat: <a href="${env.TEAM_CHAT_URL}">${env.TEAM_CHAT_URL}</a></p>`) : '';
    jobs.push(send({
      from: env.MAIL_FROM, to: a.email,
      subject: uk ? `Вашу заявку ${number} прийнято` : `Your application ${number} has been received`,
      html: uk
        ? `<p>Вітаю, ${esc(a.name)}!</p><p>Дякую, що долучаєтеся до команди. Вашу заявку зареєстровано за номером <b>${number}</b>.</p><p>Документи команди: <a href="https://kamelchuk.org.ua/dokumenty/">kamelchuk.org.ua/dokumenty</a></p>${chat}<p>Координатор зателефонує вам найближчим часом.</p><p>Юрій Камельчук</p>`
        : `<p>Hello ${esc(a.name)},</p><p>Thank you for joining the team. Your application is registered under number <b>${number}</b>.</p><p>Team documents: <a href="https://kamelchuk.org.ua/en/documents/">kamelchuk.org.ua/en/documents</a></p>${chat}<p>A coordinator will call you soon.</p><p>Yurii Kamelchuk</p>`,
    }));
  }
  await Promise.allSettled(jobs);
  return json({ number });
};
