// Єдине джерело даних сайту: контакти, організації, теми, соцмережі.
export type Lang = 'uk' | 'en';

// Фото поки що зі старого сайту (Weblium CDN). Замінити на власні файли в public/img
// після отримання професійного портрета (див. бриф, розділ 8).
const CDN = 'https://res2.weblium.site/res/69980c6e3f713a88dfcd471e';
export const photos = {
  portrait: `${CDN}/69a4bc3b390d65531eab3b26?nowebp`,
  hero: `${CDN}/69a4c52ada31b75849241302?nowebp`,
};

export const contacts = {
  email: 'zvernennia@kamelchuk.org',
  hours: { uk: 'Пн–Пт, 9:00–18:00', en: 'Mon–Fri, 9:00–18:00' },
  offices: [
    {
      name: { uk: 'Приймальня округу №124', en: 'District No. 124 office' },
      person: { uk: 'Валерій Давидюк', en: 'Valerii Davydiuk' },
      phone: '+38 068 128 30 38',
      address: { uk: 'м. Шептицький, вул. Стуса, 20', en: '20 Stusa St, Sheptytskyi' },
    },
    {
      name: { uk: 'Київська приймальня', en: 'Kyiv office' },
      person: { uk: 'Юлія Бондар', en: 'Yuliia Bondar' },
      phone: '+38 097 316 08 08',
      address: { uk: 'м. Київ, вул. Грушевського, 26/1', en: '26/1 Hrushevskoho St, Kyiv' },
    },
  ],
};

export const socials = [
  { name: 'Telegram', url: 'https://t.me/kamelchukyuriy' },
  { name: 'Facebook', url: 'https://facebook.com/yuriy.kamelchuk' },
  { name: 'YouTube', url: 'https://www.youtube.com/@YuriyKamelchuk' },
  { name: 'Instagram', url: 'https://instagram.com/kamelchuk.yuriy' },
  { name: 'X', url: 'https://x.com/kamelchuk' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/yuriykamelchuk' },
  { name: 'TikTok', url: 'https://tiktok.com/@kamelchuk.yuriy' },
];

export const orgs = [
  { url: 'https://uanation.org', uk: 'Партія «Українська Нація»', en: 'Ukrainian Nation party' },
  { url: 'https://msc.org.ua', uk: 'Центр Підтримки Військових', en: 'Military Support Center' },
  { url: 'https://spilnota.net', uk: 'Українська Бізнес Спільнота', en: 'Ukrainian Business Community' },
  { url: 'https://cu.org.ua', uk: 'Кардинал Університет', en: 'Cardinal University' },
  { url: 'https://kff.org.ua', uk: 'Фонд Родини Камельчуків', en: 'Kamelchuk Family Foundation' },
  { url: 'https://unpf.fund', uk: 'Фонд підтримки української нації', en: 'Ukrainian Nation Support Fund' },
  { url: 'https://hrc.org.ua', uk: 'Центр Відновлення (HRC)', en: 'Recovery Center (HRC)' },
  { url: 'https://isgua.org.ua', uk: 'Інститут Стратегії Громади', en: 'Community Strategy Institute' },
  { url: 'https://politix.org.ua', uk: 'Politix', en: 'Politix' },
];

export const topics = [
  {
    id: 'state', icon: '🛡',
    uk: { t: 'Сильна держава', d: 'Армія, безпека, відповідальність влади, сильні інституції.' },
    en: { t: 'A strong state', d: 'The army, security, accountable government and strong institutions.' },
  },
  {
    id: 'energy', icon: '⚡',
    uk: { t: 'Енергетична незалежність', d: 'Тарифи, вугілля, газ, атом, боротьба з корупцією, енергобезпека.' },
    en: { t: 'Energy independence', d: 'Tariffs, coal, gas, nuclear, fighting corruption, energy security.' },
  },
  {
    id: 'europe', icon: '🇪🇺',
    uk: { t: 'Європейська суб\'єктність України', d: 'ПАРЄ, ЄС, НАТО, Ініціатива Трьох Морів, міжнародна підтримка.' },
    en: { t: 'Ukraine as a European actor', d: 'PACE, the EU, NATO, the Three Seas Initiative, international support.' },
  },
  {
    id: 'fair', icon: '🤝',
    uk: { t: 'Справедливість для військових і громадян', d: 'Мобілізація, ТЦК, реабілітація, гідність військових.' },
    en: { t: 'Fairness for soldiers and citizens', d: 'Mobilisation, recruitment centres, rehabilitation, dignity for soldiers.' },
  },
  {
    id: 'team', icon: '👥',
    uk: { t: 'Нова політична команда', d: 'Партія, регіони, кандидати, чесні правила відбору, кодекс.' },
    en: { t: 'A new political team', d: 'The party, regions, candidates, fair selection rules, a code of conduct.' },
  },
] as const;
export type Pillar = (typeof topics)[number]['id'];

export const appealTopics = {
  uk: ['Соціальний захист', 'Енергетика і комунальні послуги', 'Підтримка військових і ветеранів', 'Бізнес і економіка', 'Правова допомога', 'Інфраструктура громади', 'Інше'],
  en: ['Social protection', 'Energy and utilities', 'Support for soldiers and veterans', 'Business and economy', 'Legal assistance', 'Community infrastructure', 'Other'],
};

export const regions = [
  'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська', 'Закарпатська', 'Запорізька',
  'Івано-Франківська', 'Київська', 'м. Київ', 'Кіровоградська', 'Луганська', 'Львівська', 'Миколаївська',
  'Одеська', 'Полтавська', 'Рівненська', 'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
  'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська', 'АР Крим', 'За кордоном',
];
