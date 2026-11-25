/**
 * Копія журналу приймальні (kamelchuk.org/journal) у Google-таблицю «📥 ЖУРНАЛ. Камельчук».
 * Джерело правди — CRM; таблиця оновлюється щогодини і служить архівом та для звітів у Drive.
 * Аркуші «Справи» і «Дії» перезаписуються повністю (разом із колонками «(авто)», які рахує CRM),
 * тож формули аркуша «Звіт» продовжують працювати. Редагувати ці аркуші вручну не потрібно.
 *
 * Вхід: скрипт показує CRM свій Google-акаунт (ScriptApp.getIdentityToken()). Працює, якщо цей акаунт —
 * координатор журналу (роль admin). Секретів зберігати не треба. Запасний варіант — Script Property
 * JOURNAL_TOKEN = секрет JOURNAL_EXPORT_TOKEN з Cloudflare.
 *
 * Встановлення (один раз):
 * 1. Таблиця → Розширення → Apps Script → вставити цей файл.
 * 2. Project Settings → «Show appsscript.json» → замінити його вміст на scripts/journal-sheets-sync.appsscript.json.
 * 3. Запустити syncJournal() вручну (дати дозвіл), потім installTrigger() — і далі щогодини автоматично.
 */
const JOURNAL_URL = 'https://kamelchuk.org/api/sync/journal';

function syncJournal() {
  const token = PropertiesService.getScriptProperties().getProperty('JOURNAL_TOKEN') || ScriptApp.getIdentityToken();
  if (!token) throw new Error('Немає входу: додайте openid і userinfo.email в appsscript.json');
  const res = UrlFetchApp.fetch(JOURNAL_URL, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('CRM відповіла ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200));
  const data = JSON.parse(res.getContentText());
  const ss = SpreadsheetApp.getActive();
  write_(ss.getSheetByName('Справи'), data.cases);
  write_(ss.getSheetByName('Дії'), data.actions);
}

function write_(sheet, rows) {
  if (!sheet || !rows || !rows.length) return;
  const width = rows[0].length;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const values = rows.map(function (r, i) {
    return r.map(function (v) { return i > 0 && typeof v === 'string' && iso.test(v) ? new Date(v + 'T12:00:00') : v; });
  });
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), values.length), Math.max(width, sheet.getLastColumn() || width)).clearContent();
  if (sheet.getMaxRows() < values.length) sheet.insertRowsAfter(sheet.getMaxRows(), values.length - sheet.getMaxRows());
  sheet.getRange(1, 1, values.length, width).setValues(values);
}

function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncJournal') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncJournal').timeBased().everyHours(1).create();
}

// Разовий імпорт архівних справ з таблиці «📋 Розклад копіювання звернень», аркуш «Справи для CRM».
// Номери КЗ зберігаються; повторний запуск лише оновлює ті самі справи.
const IMPORT_SHEET_ID = '1e0N1nDtPoWYUYgaQtWnCUcB1aDYOhg8MzzcyHqNxmuU';
function importArchive() {
  const rows = SpreadsheetApp.openById(IMPORT_SHEET_ID).getSheetByName('Справи для CRM').getDataRange().getDisplayValues();
  const h = rows.shift();
  const col = function (name) { return h.indexOf(name); };
  const SRC = { 'Звернення громадянина/організації': 'Звернення громадянина', 'Ініціатива депутата / листування': 'Ініціатива депутата' };
  const cases = rows.filter(function (r) { return /^КЗ-\d{4}-\d+$/.test(r[col('ID КЗ')]); }).map(function (r) {
    const d = [];
    if (r[col('Тип')]) d.push('Тип: ' + r[col('Тип')]);
    if (r[col('Документів')]) d.push('Документів у справі: ' + r[col('Документів')] + ' (вхідних ' + r[col('Вхідних')] + ', вихідних ' + r[col('Вихідних')] + '), останній ' + r[col('Останній документ')]);
    d.push('Перенесено з архіву приймальні');
    const c = { id: r[col('ID КЗ')], opened: r[col('Дата відкриття')], initiator: r[col('Ініціатор')], office: r[col('Приймальня')],
      summary: r[col('Суть')], source: SRC[r[col('Джерело')]] || r[col('Джерело')], responsible: r[col('Відповідальний')],
      files: r[col('Посилання на справу')], status: 'В роботі', details: d.join('\n') };
    if (r[col('Населений пункт')]) c.city = r[col('Населений пункт')];
    return c;
  });
  const token = PropertiesService.getScriptProperties().getProperty('JOURNAL_TOKEN') || ScriptApp.getIdentityToken();
  const res = UrlFetchApp.fetch('https://kamelchuk.org/api/sync/import', { method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token }, payload: JSON.stringify({ cases: cases }), muteHttpExceptions: true });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText().slice(0, 500));
  if (res.getResponseCode() !== 200) throw new Error('CRM відповіла ' + res.getResponseCode());
  syncJournal();
}

// Перший запуск: дозволити доступ, імпортувати архів, скопіювати CRM у таблицю і ввімкнути щогодинну копію.
function setup() {
  importArchive();
  installTrigger();
}
