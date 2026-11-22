# kamelchuk.org

Офіційний сайт народного депутата України Юрія Камельчука. Astro + Cloudflare Pages, українська (`/`) та англійська (`/en/`) версії.

Бриф сайту: Google Doc «01 Бриф — kamelchuk.org» (папка «Брифи сайтів екосистеми» на Drive).

## Розробка

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # статичний сайт у dist/
```

## Структура

- `src/data/site.ts` — контакти, телефони приймалень, організації, теми, соцмережі, фото.
- `src/i18n.ts` — адреси сторінок і переклади інтерфейсу.
- `src/content/news|blog|media/{uk,en}/*.md` — публікації. Українська та англійська версії однієї публікації мають однаковий `key`.
- `src/views/*.astro` — сторінки (одна view на обидві мови), `src/pages/` — маршрути.
- `functions/api/*` — Cloudflare Pages Functions для звернень.

## Звернення

`POST /api/appeal` приймає форму, присвоює номер `S{n}-{місяць}-{рік}` (лічильник щомісяця з 1, київський час), зберігає в KV і розсилає:

| Канал | Налаштування (змінні середовища Cloudflare Pages) |
|---|---|
| Telegram-бот (Юрій, Юлія Бондар) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS` (через кому) |
| Google Таблиця | `SHEETS_WEBHOOK_URL` (Apps Script, що дописує рядок) |
| Email у приймальню + автовідповідь | `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` |

`GET /api/status?n=S1-11-2026` повертає лише статус: `received` (прийнято), `in_progress` (в роботі), `answered` (надано відповідь).
`POST /api/admin/status` з `Authorization: Bearer $ADMIN_TOKEN` і `{number, status}` змінює статус.

Хостинг: Cloudflare, команда збірки `npm run build`, папка `dist`, Node 22 (`.nvmrc`). `wrangler.jsonc` описує статичний сайт; деплой: `npx wrangler deploy`.

Форма звернень потребує Cloudflare Pages Functions або Worker з KV `APPEALS` (`npx wrangler kv namespace create APPEALS`). Підключимо, коли будуть токени Telegram, таблиця і пошта.

## Що ще потрібно

- Робочі телефони приймалень (Валерій Давидюк — округ №124, Юлія Бондар — Київ) у `src/data/site.ts`.
- Професійне портретне фото і фото для ЗМІ (зараз фото підтягуються зі старого сайту на Weblium).
- Теза банера, адреса приймальні округу, джерела даних для «Звітів депутата».
- Посилання на email-розсилку; підключення форми підписки.
- Скринька zvernennia@kamelchuk.org (після перенесення домену в Cloudflare).
