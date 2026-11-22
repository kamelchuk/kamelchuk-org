import type { Lang } from './data/site';

export const routes = {
  home: { uk: '/', en: '/en/' },
  about: { uk: '/pro-mene/', en: '/en/about/' },
  positions: { uk: '/pozytsiia/', en: '/en/positions/' },
  activity: { uk: '/diialnist/', en: '/en/activity/' },
  district: { uk: '/okruh-124/', en: '/en/district-124/' },
  party: { uk: '/partiia/', en: '/en/party/' },
  reports: { uk: '/zvity/', en: '/en/reports/' },
  news: { uk: '/novyny/', en: '/en/news/' },
  blog: { uk: '/blog/', en: '/en/blog/' },
  media: { uk: '/media/', en: '/en/media/' },
  appeal: { uk: '/zvernennia/', en: '/en/appeal/' },
  privacy: { uk: '/polityka-pryvatnosti/', en: '/en/privacy/' },
} as const;
export type RouteKey = keyof typeof routes;

export const nav: RouteKey[] = ['about', 'positions', 'activity', 'district', 'party', 'reports', 'news', 'blog', 'media'];

const dict = {
  uk: {
    name: 'Юрій Камельчук',
    role: 'Народний депутат України · Лідер партії «Українська Нація»',
    about: 'Про мене', positions: 'Позиція', activity: 'Діяльність', district: 'Округ №124', party: 'Партія',
    reports: 'Звіти депутата', news: 'Новини', blog: 'Блог', media: 'Медіа', appeal: 'Написати звернення',
    privacy: 'Політика приватності', home: 'Головна',
    readMore: 'Читати далі', allNews: 'Усі новини', subscribe: 'Підписатися',
    subscribeTitle: 'Будьте в курсі', subscribeText: 'Новини та позиції Юрія Камельчука — у Telegram-каналі та email-розсилці.',
    emailPh: 'Ваш email', telegramChannel: 'Telegram-канал',
    orgsTitle: 'Організації', topicsTitle: 'За що я працюю', newsTitle: 'Новини', mediaTitle: 'Ефіри та інтерв\'ю',
    officeTitle: 'Приймальня', officeText: 'Звернення приймаємо від громадян з усієї України. Кожне звернення отримує номер, за яким можна перевірити статус.',
    phoneSoon: 'номер уточнюється', hours: 'Прийом дзвінків', footerNote: 'Народний депутат Верховної Ради України',
    rights: 'Усі права захищено', soon: 'Розділ наповнюється', langSwitch: 'EN',
  },
  en: {
    name: 'Yurii Kamelchuk',
    role: 'Member of Parliament of Ukraine · Leader of the Ukrainian Nation party',
    about: 'About', positions: 'Positions', activity: 'Activity', district: 'District 124', party: 'Party',
    reports: 'Reports', news: 'News', blog: 'Blog', media: 'Media', appeal: 'Send an appeal',
    privacy: 'Privacy policy', home: 'Home',
    readMore: 'Read more', allNews: 'All news', subscribe: 'Subscribe',
    subscribeTitle: 'Stay informed', subscribeText: 'News and positions of Yurii Kamelchuk — on Telegram and by email.',
    emailPh: 'Your email', telegramChannel: 'Telegram channel',
    orgsTitle: 'Organisations', topicsTitle: 'What I work for', newsTitle: 'News', mediaTitle: 'Broadcasts and interviews',
    officeTitle: 'Public office', officeText: 'We accept appeals from citizens across Ukraine. Every appeal gets a number you can use to check its status.',
    phoneSoon: 'number to be confirmed', hours: 'Phone hours', footerNote: 'Member of the Verkhovna Rada of Ukraine',
    rights: 'All rights reserved', soon: 'This section is being filled', langSwitch: 'UA',
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}

export function href(key: RouteKey, lang: Lang) {
  return routes[key][lang];
}

export function fmtDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
