// Оновлює src/data/bills.json з Порталу відкритих даних Верховної Ради.
// Запуск: node scripts/update-bills.mjs  (Node 18+, без залежностей).
// Беруться законопроєкти IX скликання, де Юрій Камельчук серед ініціаторів:
// «власні» — де ініціаторів 1–3, вони показуються в блоці; решта йде лише в лічильник співавторства.
// Якщо портал недоступний або відповідь дивна, файл не змінюється.
import { readFile, writeFile } from 'node:fs/promises';

const MP_ID = '21122'; // ідентифікатор депутата у наборах ВР
const MAX_OWN_AUTHORS = 3;
const BASE = 'https://data.rada.gov.ua/ogd/zpr/skl9';
const OUT = new URL('../src/data/bills.json', import.meta.url);

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

async function csv(name) {
  const r = await fetch(`${BASE}/${name}.csv`, { headers: { 'user-agent': 'kamelchuk-org-site-updater' } });
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  const rows = parseCSV(await r.text());
  const [head, ...body] = rows;
  return body.filter((r) => r.length >= head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

// Тема для фільтра: енергетика за ключовими словами, далі за рубрикою ВР.
function topicOf(title, rubric) {
  if (/енерг|електр|газ|нафт|вугіл|шахт|тепл|палив|енергосервіс|декарбон|ЖКП|житлово-комунальн/i.test(title)) return 'energy';
  if (/Правова політика/.test(rubric)) return 'law';
  if (/Економічна політика/.test(rubric)) return 'econ';
  return 'other';
}

// Назви з лапками «», без імен приватних осіб у депутатських запитах.
function cleanTitle(title) {
  let t = title.replace(/"([^"]*)"/g, '«$1»').trim();
  if (/депутатського запиту/.test(t)) {
    t = t.replace(/ народного депутата України [А-ЯІЇЄҐ][^\s]+ [А-ЯІЇЄҐ]\.[А-ЯІЇЄҐ]\./, '');
    t = t.replace(/ громадян(ина|ки|ам|ину)? [А-ЯІЇЄҐ][^)]*\)/, ')');
  }
  return t;
}

const [initiators, main] = await Promise.all([csv('bills_initiators-skl9'), csv('bills_main-skl9')]);
const mine = new Set(initiators.filter((r) => r.person_id === MP_ID).map((r) => r.bill_id));
if (mine.size < 100) throw new Error(`Підозріло мало документів (${mine.size}), файл не змінено`);
const authors = {};
for (const r of initiators) if (mine.has(r.bill_id)) authors[r.bill_id] = (authors[r.bill_id] ?? 0) + 1;

const all = main.filter((b) => mine.has(b.bill_id));
const own = all
  .filter((b) => authors[b.bill_id] <= MAX_OWN_AUTHORS)
  .map((b) => ({
    id: b.bill_id,
    number: b.number,
    date: b.registrationDate,
    kind: /Постанови/.test(b.type) ? 'resolution' : 'law',
    title: cleanTitle(b.title),
    topic: topicOf(b.title, b.rubric),
    phase: b.currentPhase_title,
    phaseDate: b.currentPhase_date,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

const next = {
  updated: new Date().toISOString().slice(0, 10),
  source: 'https://data.rada.gov.ua/open/data/zpr-skl9',
  stats: {
    own: own.length,
    ownPassed: own.filter((b) => /підписано/.test(b.phase)).length,
    coauthored: all.length,
    coauthoredLaws: all.filter((b) => b.currentPhase_title === 'Закон підписано').length,
  },
  bills: own,
};

const prev = JSON.parse(await readFile(OUT, 'utf8'));
const strip = (o) => JSON.stringify({ ...o, updated: '' });
if (strip(prev) === strip(next)) { console.log('Без змін'); process.exit(0); }
await writeFile(OUT, JSON.stringify(next, null, 1) + '\n');
console.log('Оновлено:', next.stats);
