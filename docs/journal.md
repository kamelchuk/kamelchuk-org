# Журнал приймальні (CRM) — kamelchuk.org/journal

Робоче місце команди приймалень: справи, ланцюжки дій зі строками відповідей, дашборд.
Схема повторює Google-таблицю «📥 ЖУРНАЛ. Камельчук» (Drive → Приймальня).

## Як влаштовано

| Частина | Де |
|---|---|
| Сторінка | `src/pages/journal/index.astro` + `src/journal/app.ts` (без фреймворків) |
| API | `worker/journal/api.ts` → `/api/journal/*` |
| Дані | SQLite у Durable Object `JournalStore` (`worker/journal/store.ts`), створюється автоматично при деплої |
| Вхід | Cloudflare Access (email + одноразовий код) → перевірка JWT у `worker/journal/auth.ts` |
| Ролі | розділ «Команда»: координатор (усе, включно з командою й довідниками), помічник (веде справи), перегляд |
| Строки й стан дій | `worker/journal/logic.ts` (як формули аркуша «Дії») |
| Довідники | типові в `worker/journal/dicts.ts`, змінюються в розділі «Довідники» |
| Копія в Google-таблицю | `scripts/journal-sheets-sync.gs` (Apps Script, щогодини) ← `/api/sync/journal` |

Кожне звернення з форми сайту одразу стає справою `КЗ-РРРР-NNNN` (приймальня «Kamelchuk.org», відповідальна — Юлія Бондар,
змінюється змінною `JOURNAL_SITE_RESPONSIBLE`). Громадянин отримує цей самий номер і за ним перевіряє статус на сторінці «Звернення»:
«Нова» → «Прийнято», закриті статуси → «Надано відповідь», решта → «В роботі».

Без налаштованого Access журнал закритий для всіх (сторінка й API відповідають 403). Усі зміни пишуться в історію (хто, коли, що).

## Увімкнення (один раз, ~10 хвилин)

1. **Zero Trust.** dash.cloudflare.com → Zero Trust. Якщо вперше: обрати назву команди (напр. `kamelchuk`) і план Free
   (до 50 користувачів, 0 $; Cloudflare може попросити картку).
   Назва команди дає домен `kamelchuk.cloudflareaccess.com` — це `CF_ACCESS_TEAM_DOMAIN`.
2. **Спосіб входу.** Zero Trust → Settings → Authentication → Login methods: має бути **One-time PIN** (код на пошту).
3. **Застосунок.** Zero Trust → Access → Applications → Add an application → **Self-hosted**:
   - Name: `Журнал приймальні`, Session duration: `24 hours`.
   - Public hostname: домен `kamelchuk.org`, path `journal`. Додати ще один: `kamelchuk.org`, path `api/journal`.
   - Policy: Action **Allow**, Include → **Emails** → email-и команди.
   - Зберегти й скопіювати **Application Audience (AUD) Tag** — це `CF_ACCESS_AUD`.
4. **Змінні Worker.** Workers & Pages → kamelchuk-org → Settings → Variables and Secrets:
   - `CF_ACCESS_TEAM_DOMAIN` = `kamelchuk.cloudflareaccess.com`
   - `CF_ACCESS_AUD` = тег з кроку 3
   - `JOURNAL_ADMINS` = email-и координаторів через кому (мають доступ завжди, навіть до заповнення «Команди»)
   - `JOURNAL_EXPORT_TOKEN` (Secret, необов'язково) = довгий випадковий рядок, якщо копію в таблицю робить не координатор
   - `TELEGRAM_BOT_TOKEN` (Secret) = токен бота від @BotFather, `TELEGRAM_CHAT_IDS` = id чатів через кому
     (id людини можна дізнатися в @userinfobot; людина має натиснути Start у боті; перевірка — POST `/api/journal/telegram/test`)
5. Відкрити https://kamelchuk.org/journal → «Команда» → додати кожного помічника (email, ім'я, роль).
   Новий помічник має бути і в політиці Access (крок 3), і в «Команді».
6. **Копія в таблицю.** У таблиці «📥 ЖУРНАЛ. Камельчук» під акаунтом координатора: Розширення → Apps Script →
   вставити `scripts/journal-sheets-sync.gs`, у Project Settings увімкнути «Show appsscript.json» і вставити
   `scripts/journal-sheets-sync.appsscript.json`, запустити `syncJournal`, потім `installTrigger`.
   Скрипт входить Google-акаунтом (ID token), секрет не потрібен.
7. **Імпорт старих справ.** Координатор: POST `/api/journal/import` з `{"cases":[{"id":"КЗ-2025-0001", …поля справи}]}`
   — нові справи створюються з цим номером, наявні оновлюються. Нумерація нових справ продовжується після найбільшого номера року.
   Аркуші «Справи» і «Дії» далі лише копія з CRM — вручну їх не редагувати.

## Локальна розробка

```bash
npm run build
npx wrangler dev --var JOURNAL_DEV_EMAIL:you@example.com --var JOURNAL_ADMINS:you@example.com
# http://localhost:8787/journal/  (JOURNAL_DEV_EMAIL працює лише на localhost)
```

## Сповіщення про звернення через бота-асистента

Сайт не тримає токен Telegram-бота. Кожне звернення з форми потрапляє в чергу, а бот (Крістофер на сервері Hetzner)
сам її забирає і надсилає Юрію та Юлії Бондар разом із файлами.

1. Координатор: `POST /api/journal/notify/code` → одноразовий код (діє 7 днів).
2. Бот: `POST /api/notify/claim` з `{"code": "…"}` → `{"key": "…"}`. Ключ зберігається лише на сервері бота.
3. Бот щохвилини: `GET /api/notify/pending` (заголовок `Authorization: Bearer <key>`) → `[{id, case_id, text, files:[{id,name,type,size}]}]`;
   файл — `GET /api/notify/file/<id>`; після надсилання — `POST /api/notify/ack` з `{"ids":[…]}`.
4. Стан: `GET /api/journal/notify`, тест: `POST /api/journal/notify/test`.
