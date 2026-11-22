// Єдине джерело даних сайту kamelchuk.org.ua: контакти, штаби, стовпи, статуси, проєкти, організації.
// Бриф: Google Doc «02 Бриф — kamelchuk.org.ua». Тексти документів: «Документи УН».
export type Lang = 'uk' | 'en';

export const photos = {
  portrait: '/images/yurii-portrait.jpg',
  portraitFull: '/images/yurii-kamelchuk-portrait.jpg',
};

export const contacts = {
  email: 'komanda@kamelchuk.org.ua',
  personalSite: 'https://kamelchuk.org',
  partySite: 'https://uanation.org',
  // Загальний Telegram-чат команди ще не створено (задача в Todoist на 23.11.2026)
  teamChat: '',
};

// Штаби на мапі. Координати приблизні (за адресою).
export const hqs = [
  {
    id: 'kyiv',
    name: { uk: 'Центральний штаб, Київ', en: 'Central HQ, Kyiv' },
    region: 'м. Київ',
    address: { uk: 'м. Київ, вул. Грушевського, 26/1', en: '26/1 Hrushevskoho St, Kyiv' },
    phone: '+38 097 316 08 08',
    lat: 50.4466, lng: 30.5372,
  },
  {
    id: 'sheptytskyi',
    name: { uk: 'Штаб у Шептицькому (Львівщина)', en: 'Sheptytskyi HQ (Lviv region)' },
    region: 'Львівська',
    address: { uk: 'м. Шептицький, вул. Стуса, 20', en: '20 Stusa St, Sheptytskyi' },
    phone: '+38 068 128 30 38',
    lat: 50.3869, lng: 24.2289,
  },
];

export const socials = [
  { name: 'Telegram', url: 'https://t.me/kamelchukyuriy' },
  { name: 'Facebook', url: 'https://facebook.com/yuriy.kamelchuk' },
  { name: 'YouTube', url: 'https://www.youtube.com/@YuriyKamelchuk' },
  { name: 'Instagram', url: 'https://instagram.com/kamelchuk.yuriy' },
  { name: 'X', url: 'https://x.com/kamelchuk' },
  { name: 'TikTok', url: 'https://tiktok.com/@kamelchuk.yuriy' },
];

// 5 тематичних стовпів (позиціонування, 22.11.2026)
export const pillars = [
  { id: 'state', icon: '🛡',
    uk: { t: 'Сильна держава', d: 'Армія, безпека, відповідальність влади, інституції.' },
    en: { t: 'A strong state', d: 'The army, security, accountable government, institutions.' } },
  { id: 'energy', icon: '⚡',
    uk: { t: 'Енергетична незалежність', d: 'Тарифи, вугілля, газ, атом, корупція, енергобезпека.' },
    en: { t: 'Energy independence', d: 'Tariffs, coal, gas, nuclear, corruption, energy security.' } },
  { id: 'europe', icon: '🇪🇺',
    uk: { t: 'Європейська суб’єктність України', d: 'ПАРЄ, ЄС, НАТО, Три моря, міжнародна підтримка.' },
    en: { t: 'Ukraine as a European actor', d: 'PACE, the EU, NATO, the Three Seas, international support.' } },
  { id: 'fair', icon: '🤝',
    uk: { t: 'Справедлива політика щодо військових і громадян', d: 'Мобілізація, ТЦК, реабілітація, гідність військових.' },
    en: { t: 'Fair policy for soldiers and citizens', d: 'Mobilisation, recruitment centres, rehabilitation, dignity for soldiers.' } },
  { id: 'team', icon: '👥',
    uk: { t: 'Нова політична команда', d: 'Партія, регіони, кандидати, правила відбору, кодекс.' },
    en: { t: 'A new political team', d: 'The party, regions, candidates, selection rules, a code of conduct.' } },
] as const;

// Тріада «Сила. Закон. Розвиток» (документ «Ідеологія»)
export const triad = [
  { id: 'sila', uk: { t: 'Сила', d: 'Бере на себе безпеку, армію, суверенітет та наші міжнародні позиції.' },
    en: { t: 'Strength', d: 'Security, the army, sovereignty and our international standing.' } },
  { id: 'zakon', uk: { t: 'Закон', d: 'Гарантує безкомпромісну боротьбу з корупцією, незалежні суди та народовладдя.' },
    en: { t: 'Law', d: 'An uncompromising fight against corruption, independent courts and rule by the people.' } },
  { id: 'rozvytok', uk: { t: 'Розвиток', d: 'Охоплює економічне зростання, ідентичність, соціальну сферу, екологію та відповідальність перед майбутніми поколіннями.' },
    en: { t: 'Development', d: 'Economic growth, identity, social policy, the environment and responsibility to future generations.' } },
];

// Статуси учасників команди (бриф, розділ 2). Прихильник — залишив контакт і ознайомився з документами.
export const statuses = [
  { id: 'supporter', uk: { t: 'Прихильник', d: 'Залишаєте контакт, знайомитеся з документами і отримуєте новини кампанії.' },
    en: { t: 'Supporter', d: 'Leave your contact, read the documents and receive campaign news.' } },
  { id: 'activist', uk: { t: 'Активіст', d: 'Берете участь у проєктах і подіях команди у своїй громаді.' },
    en: { t: 'Activist', d: 'Take part in team projects and events in your community.' } },
  { id: 'agitator', uk: { t: 'Агітатор', d: 'Говорите з людьми «очі в очі»: двори, підприємства, зустрічі.' },
    en: { t: 'Canvasser', d: 'Talk to people face to face: neighbourhoods, workplaces, meetings.' } },
  { id: 'observer', uk: { t: 'Спостерігач', d: 'Захищаєте голоси на дільниці в день виборів разом з юридичною командою.' },
    en: { t: 'Observer', d: 'Protect the vote at a polling station on election day, with the legal team.' } },
  { id: 'hq', uk: { t: 'Член штабу', d: 'Організовуєте роботу команди у своєму регіоні.' },
    en: { t: 'HQ member', d: 'Organise the team’s work in your region.' } },
] as const;

// Напрями, у яких команда збирає людей (бриф, розділ 1)
export const directions = [
  { id: 'elections', uk: 'Вибори', en: 'Elections' },
  { id: 'social', uk: 'Соціальні проєкти', en: 'Social projects' },
  { id: 'youth', uk: 'Молодіжні проєкти', en: 'Youth projects' },
  { id: 'business', uk: 'Бізнес-проєкти', en: 'Business projects' },
  { id: 'international', uk: 'Міжнародні проєкти', en: 'International projects' },
  { id: 'info', uk: 'Інформаційні проєкти', en: 'Information projects' },
];

// Організації (той самий список, що й на kamelchuk.org)
export const orgs = [
  { url: 'https://uanation.org', uk: 'Партія «Українська Нація»', en: 'Ukrainian Nation party',
    d: { uk: 'Членство в партії оформлюється на uanation.org.', en: 'Party membership is handled at uanation.org.' } },
  { url: 'https://msc.org.ua', uk: 'Центр Підтримки Військових', en: 'Military Support Center',
    d: { uk: 'Допомога військовим, ветеранам і їхнім родинам.', en: 'Help for soldiers, veterans and their families.' } },
  { url: 'https://spilnota.net', uk: 'Українська Бізнес Спільнота', en: 'Ukrainian Business Community',
    d: { uk: 'Платформа комунікації бізнесу і влади.', en: 'A platform connecting business and government.' } },
  { url: 'https://cu.org.ua', uk: 'Кардинал Університет', en: 'Cardinal University',
    d: { uk: 'Освіта та розвиток лідерів.', en: 'Education and leadership development.' } },
  { url: 'https://kff.org.ua', uk: 'Фонд Родини Камельчуків', en: 'Kamelchuk Family Foundation',
    d: { uk: 'Благодійні та соціальні програми.', en: 'Charitable and social programmes.' } },
  { url: 'https://unpf.fund', uk: 'Фонд підтримки української нації', en: 'Ukrainian Nation Support Fund',
    d: { uk: 'Фінансування соціальних програм.', en: 'Funding for social programmes.' } },
  { url: 'https://hrc.org.ua', uk: 'Центр Відновлення (HRC)', en: 'Recovery Center (HRC)',
    d: { uk: 'Відновлення і реабілітація ветеранів.', en: 'Recovery and rehabilitation of veterans.' } },
  { url: 'https://isgua.org.ua', uk: 'Інститут Стратегії Громади', en: 'Community Strategy Institute',
    d: { uk: 'Стратегії розвитку громад.', en: 'Development strategies for communities.' } },
  { url: 'https://politix.org.ua', uk: 'Politix', en: 'Politix',
    d: { uk: 'Навчання з політичного менеджменту, комунікацій та лідерства.', en: 'Training in political management, communication and leadership.' } },
];

// Проєкти УН (документ «Проєкти УН», пункт 18 в оригіналі порожній — пропущено).
// Описи — з документа «Система УН», де вони є.
export const projects = [
  { uk: 'Фільм «Сила. Закон. Розвиток»', en: 'Film “Strength. Law. Development”' },
  { uk: 'Українці закордоном', en: 'Ukrainians abroad', d: { uk: 'Окрема пропозиція для діаспори.', en: 'A dedicated offer for the diaspora.' } },
  { uk: 'Національні консультації', en: 'National Consultations', d: { uk: 'Радимось з людьми про важливе.', en: 'We consult people on what matters.' } },
  { uk: 'Рада Української Нації', en: 'Council of the Ukrainian Nation', d: { uk: 'Напрацьовуємо спільні рішення.', en: 'We work out shared decisions.' } },
  { uk: 'Рух за Відновлення Української Нації', en: 'Movement for the Renewal of the Ukrainian Nation', d: { uk: 'Активізуємо обговорення рішень.', en: 'We bring decisions into public discussion.' } },
  { uk: 'Школа молодих лідерів Української Нації', en: 'Young Leaders School', d: { uk: 'Залучаємо молодь до проєктів.', en: 'We involve young people in projects.' } },
  { uk: 'Академія Української Нації', en: 'Academy of the Ukrainian Nation', d: { uk: 'Навчаємо політичної та громадянської свідомості.', en: 'We teach political and civic awareness.' } },
  { uk: 'Актив Української Нації', en: 'Ukrainian Nation Activists', d: { uk: 'Формуємо резерв майбутніх політиків.', en: 'We build a pool of future politicians.' } },
  { uk: 'Код Української Нації — кемп, стратегічна гра', en: 'Ukrainian Nation Code — a strategy game camp' },
  { uk: 'Ukrainian Nation Digital Coin', en: 'Ukrainian Nation Digital Coin' },
  { uk: 'Праймеріз Шоу', en: 'Primaries Show', d: { uk: 'Відкритий відбір кандидатів і лідерів осередків.', en: 'Open selection of candidates and branch leaders.' } },
  { uk: 'Програма відновлення і розвитку «Відновлена Україна»', en: '“Restored Ukraine” recovery and development programme', d: { uk: 'Створюємо програму відновлення і розвитку.', en: 'We are building a recovery and development programme.' } },
  { uk: 'Програма розвитку духовності та цілісності «Зцілена Україна»', en: '“Healed Ukraine” programme of spirituality and wholeness', d: { uk: 'Ідеологічне наповнення, розвиток духовності та культури.', en: 'Values, spirituality and culture.' } },
  { uk: 'Центр Підтримки Української Нації', en: 'Ukrainian Nation Support Centre', d: { uk: 'Надаємо юридичну та психологічну допомогу.', en: 'We provide legal and psychological help.' } },
  { uk: 'Мережа Центрів Відновлення Ветеранів', en: 'Network of Veteran Recovery Centres' },
  { uk: 'Мережа Центрів Життя для літніх людей', en: 'Network of Life Centres for older people' },
  { uk: 'Українська Бізнес Спільнота', en: 'Ukrainian Business Community', d: { uk: 'Створюємо платформу комунікації бізнесу і влади.', en: 'A platform connecting business and government.' } },
  { uk: 'Фонд Процвітання Української Нації', en: 'Ukrainian Nation Prosperity Fund', d: { uk: 'Створюємо і фінансуємо соціальні програми.', en: 'We create and fund social programmes.' } },
  { uk: 'Премія Української Нації', en: 'Ukrainian Nation Award', d: { uk: 'Відзначаємо героїв та авторитетів.', en: 'We honour heroes and respected figures.' } },
  { uk: 'Конгрес Української Нації', en: 'Ukrainian Nation Congress', d: { uk: 'Збираємо форум для активних українців.', en: 'A forum for active Ukrainians.' } },
  { uk: 'Партія «Українська Нація»', en: 'Ukrainian Nation party', d: { uk: 'Беремо участь у виборах всіх рівнів.', en: 'We take part in elections at every level.' } },
  { uk: 'Команда Камельчука', en: 'Kamelchuk Team', d: { uk: 'Створюємо президентську команду і беремо участь у виборах Президента України.', en: 'We are building a presidential team to run in the presidential election.' } },
  { uk: 'Офіс Президента України Юрія Камельчука', en: 'Office of President Yurii Kamelchuk', d: { uk: 'Втілюємо програму та цілі Української Нації.', en: 'Delivering the programme and goals of the Ukrainian Nation.' } },
];

// Куди можна спрямувати внесок (бриф, розділ 3). Реквізити — після погодження Юрієм.
export const donationTargets = {
  uk: ['Партія «Українська Нація»', 'Центр Підтримки Військових', 'Мережа Центрів Відновлення Ветеранів', 'Школа молодих лідерів', 'Фонд Процвітання Української Нації'],
  en: ['Ukrainian Nation party', 'Military Support Center', 'Veteran Recovery Centres', 'Young Leaders School', 'Ukrainian Nation Prosperity Fund'],
};

export const regions = [
  'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська', 'Закарпатська', 'Запорізька',
  'Івано-Франківська', 'Київська', 'м. Київ', 'Кіровоградська', 'Луганська', 'Львівська', 'Миколаївська',
  'Одеська', 'Полтавська', 'Рівненська', 'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
  'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська', 'АР Крим', 'За кордоном',
];
