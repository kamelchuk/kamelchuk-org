---
version: alpha
name: Kamelchuk Ecosystem
description: Базовий стиль kamelchuk.org і всіх сайтів екосистеми. Строгі графітові нейтральні кольори, один бірюзовий акцент, заокруглені картки й кнопки-«пігулки». Значення взято з src/styles/global.css; якщо вони розійдуться, правильним вважається global.css, а цей файл треба оновити.
colors:
  ink: "#23252b"          # основний текст, шапка
  ink-2: "#393b42"        # темні секції, page-head
  ink-deep: "#1b1c21"     # футер, hero на головній
  muted: "#6b6f7a"        # другорядний текст, дати
  line: "#e3e6ec"         # рамки карток, роздільники
  input-border: "#cfd4dd"
  bg: "#ffffff"
  bg-soft: "#f2f4f7"      # чергування секцій
  accent: "#00c5b5"       # кнопки, акценти на темному
  accent-hover: "#00ddcb"
  accent-ink: "#00897e"   # акцент як текст на світлому (eyebrow, посилання «Детальніше»)
  on-accent: "#062b28"    # текст на бірюзовій кнопці
  tag-bg: "#dffcf8"
  blue: "#3e5496"         # рідкісний другий колір (графіки, інфоблоки)
typography:
  display:
    fontFamily: Poppins
    fontSize: 2.8rem      # clamp(2rem, 4vw, 2.8rem)
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: Poppins
    fontSize: 2.2rem      # clamp(1.6rem, 3vw, 2.2rem)
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: Poppins
    fontSize: 1.08rem
    fontWeight: 700
    lineHeight: 1.3
  eyebrow:
    fontFamily: Poppins
    fontSize: 0.8rem
    fontWeight: 600
    letterSpacing: 0.12em
  body:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: Open Sans
    fontSize: 0.82rem
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: Poppins
    fontSize: 0.95rem
    fontWeight: 600
rounded:
  sm: 8px                 # перемикач мови
  md: 10px                # поля форм
  lg: 14px                # картки (--radius)
  xl: 16px                # фото у hero
  full: 999px             # кнопки, теги
spacing:
  gutter: 20px            # бокові відступи .wrap
  grid-gap: 24px
  card-padding: 24px
  section: 72px           # 48px на мобільному
  wrap: 1180px            # максимальна ширина контенту
motion:
  hover:
    duration: 150ms
    timingFunction: ease
components:
  button-primary:
    background: "{colors.accent}"
    color: "{colors.on-accent}"
    radius: "{rounded.full}"
    padding: "0.85em 1.5em"
  button-ghost:
    border: "2px solid rgba(255,255,255,.55)"
    color: "#ffffff"
    radius: "{rounded.full}"
  button-outline:
    border: "2px solid {colors.ink-2}"
    color: "{colors.ink-2}"
    radius: "{rounded.full}"
  card:
    background: "{colors.bg}"
    border: "1px solid {colors.line}"
    radius: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  tag:
    background: "{colors.tag-bg}"
    color: "{colors.accent-ink}"
    radius: "{rounded.full}"
  header:
    background: "rgba(35,37,43,.97)"
    height: 72px
  input:
    border: "1px solid {colors.input-border}"
    radius: "{rounded.md}"
    focus: "2px solid {colors.accent}"
---

# DESIGN.md: стиль сайтів екосистеми Камельчука

Цей файл читають люди й ІІ-агенти (Claude, Cursor та інші) перед будь-якою зміною вигляду сайту. Токени вище є нормою. Нижче пояснено, як їх застосовувати.

## Характер

Офіційно, спокійно, сучасно. Сайт державного діяча, а не стартапу: жодних неонових градієнтів, «склянного» ефекту, конфетті чи анімацій заради анімацій. Довіру будують чистий текст, достатньо повітря і чесні фото.

## Кольори

- Основа: графітові нейтральні (`ink`, `ink-2`, `ink-deep`) і білий / світло-сірий фон.
- Один акцент: бірюзовий `accent`. На світлому фоні для тексту беремо темніший `accent-ink` (контраст), на темному фоні беремо `accent`.
- Текст на бірюзовій кнопці завжди `on-accent` (темно-зелений), а не білий.
- `blue` вживаємо рідко, лише як другий колір у графіках та інфоблоках.
- Секції чергуються: білий → `bg-soft` → темна (`ink-2`). Дві темні секції поспіль не ставимо.

## Типографіка

- Заголовки, кнопки, eyebrow: **Poppins** 500–700.
- Текст: **Open Sans** 400/600/700, 16px, міжрядковий інтервал 1.6.
- Обидва шрифти підтримують кирилицю. Підключаються з Google Fonts (`display=swap`).
- Розмір заголовків адаптивний через `clamp()`.
- «Eyebrow» (надзаголовок): маленький, великими літерами, розрідження 0.12em, колір акценту.
- Ширина тексту статті (`.prose`) не більше 760px.

## Сітка й відступи

- Контейнер `.wrap`: 1180px, по 20px з боків.
- Сітки `.g2/.g3/.g4/.g5` на `auto-fit` з мінімальною шириною колонки 300/260/220/190px, проміжок 24px.
- Секція має 72px зверху й знизу, на екрані до 640px 48px.
- Мобільна версія обов'язкова: усе перевіряємо на ширині 375px.

## Компоненти

- **Шапка**: липка, темна напівпрозора, висота 72px. Логотип текстовий (ім'я + посада), справа перемикач UA/EN і бірюзова кнопка «Звернення». До 1280px меню ховається під бургер.
- **Кнопки**: «пігулки» (`radius: full`). Варіанти primary (бірюза), ghost (на темному), outline (на світлому).
- **Картки**: білі, рамка `line`, радіус 14px, без тіней.
- **Теги**: маленькі «пігулки» з `tag-bg` / `accent-ink`.
- **Форми**: підпис над полем (600), поле з радіусом 10px, фокус бірюзовою обводкою.
- **Page head**: темна смуга `ink-2` з eyebrow і великим H1 на початку внутрішніх сторінок.
- **Футер**: `ink-deep`, три колонки (про автора / розділи / соцмережі), заголовки колонок бірюзові, великими літерами.

## Рух

- Лише короткі переходи на hover/focus (150ms). `scroll-behavior: smooth`.
- Складніші анімації можна брати з Anime.js або чистого CSS (наприклад, Uiverse), без React. Обов'язково з урахуванням `prefers-reduced-motion`.

## Технічні правила

- Сайти на **Astro**, стилі на чистому CSS зі змінними з `:root` (див. `src/styles/global.css`). Tailwind і React не додаємо без потреби. React-компоненти (shadcn, Magic UI тощо) лише для інтерактивних застосунків на зразок журналу приймальні.
- Нові кольори й розміри спершу додаємо як змінну в `global.css` і токен у цьому файлі, а вже потім використовуємо.
- Двомовність: кожен текст інтерфейсу має українську й англійську версії (`src/i18n.ts`).
- Доступність: контраст тексту за WCAG AA, `alt` у всіх зображень, видимий фокус.

## Як використати на іншому сайті екосистеми

1. Скопіювати цей файл у корінь нового репозиторію.
2. Змінити `name`, `description` і, за потреби, `accent` / `accent-ink` / `on-accent` / `tag-bg`. Тоді сайт матиме свій колір, але лишиться впізнаваним як частина екосистеми.
3. Решту (шрифти, сітку, компоненти) лишити без змін, якщо бриф сайту не вимагає іншого.
