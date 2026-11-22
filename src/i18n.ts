import type { Lang } from './data/site';

export const routes = {
  home: { uk: '/', en: '/en/' },
  ideas: { uk: '/idei/', en: '/en/ideas/' },
  values: { uk: '/tsinnosti/', en: '/en/values/' },
  projects: { uk: '/proiekty/', en: '/en/projects/' },
  orgs: { uk: '/orhanizatsii/', en: '/en/organisations/' },
  about: { uk: '/pro-yuriia/', en: '/en/about/' },
  team: { uk: '/komanda/', en: '/en/team/' },
  news: { uk: '/novyny/', en: '/en/news/' },
  docs: { uk: '/dokumenty/', en: '/en/documents/' },
  support: { uk: '/pidtrymaty/', en: '/en/support/' },
  join: { uk: '/doluchytysia/', en: '/en/join/' },
  privacy: { uk: '/polityka-pryvatnosti/', en: '/en/privacy/' },
} as const;
export type RouteKey = keyof typeof routes;

// Меню (бриф, розділ 3): Ідеї · Цінності · Проєкти · Організації · Про Юрія · Команда і штаби · Новини кампанії · Документи · Підтримати
export const nav: RouteKey[] = ['ideas', 'values', 'projects', 'orgs', 'about', 'team', 'news', 'docs', 'support'];

const dict = {
  uk: {
    name: 'Команда Камельчука',
    leader: 'Юрій Камельчук',
    role: 'Лідер партії «Українська Нація» · Народний депутат України',
    tagline: 'Збираємо команду для оновлення України',
    ideas: 'Ідеї', values: 'Цінності', projects: 'Проєкти', orgs: 'Організації', about: 'Про Юрія',
    team: 'Команда і штаби', news: 'Новини кампанії', docs: 'Документи', support: 'Підтримати',
    join: 'Долучитися', privacy: 'Політика приватності', home: 'Головна',
    readMore: 'Читати далі', allNews: 'Усі новини', rights: 'Усі права захищено', langSwitch: 'EN',
    footerNote: 'Сайт команди Юрія Камельчука. Особистий сайт — kamelchuk.org, партія — uanation.org.',
  },
  en: {
    name: 'Kamelchuk Team',
    leader: 'Yurii Kamelchuk',
    role: 'Leader of the Ukrainian Nation party · Member of Parliament of Ukraine',
    tagline: 'Building a team to renew Ukraine',
    ideas: 'Ideas', values: 'Values', projects: 'Projects', orgs: 'Organisations', about: 'About Yurii',
    team: 'Team and HQs', news: 'Campaign news', docs: 'Documents', support: 'Support',
    join: 'Join', privacy: 'Privacy policy', home: 'Home',
    readMore: 'Read more', allNews: 'All news', rights: 'All rights reserved', langSwitch: 'UA',
    footerNote: 'The website of Yurii Kamelchuk’s team. Personal site: kamelchuk.org; party: uanation.org.',
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}

export function href(key: RouteKey, lang: Lang) {
  return routes[key][lang];
}

export function other(key: RouteKey, lang: Lang) {
  return routes[key][lang === 'uk' ? 'en' : 'uk'];
}

export function fmtDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
