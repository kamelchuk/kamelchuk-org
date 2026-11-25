/**
 * Копія журналу приймальні (kamelchuk.org/journal) у Google-таблицю «📥 ЖУРНАЛ. Камельчук».
 * Джерело правди — CRM; таблиця оновлюється щогодини і служить архівом та для звітів у Drive.
 * Аркуші «Справи» і «Дії» перезаписуються повністю (разом із колонками «(авто)», які рахує CRM),
 * тож формули аркуша «Звіт» продовжують працювати. Редагувати ці аркуші вручну не потрібно.
 *
 * Встановлення (один раз):
 * 1. Таблиця → Розширення → Apps Script → вставити цей файл → зберегти.
 * 2. Project Settings → Script Properties → додати JOURNAL_TOKEN = значення секрету JOURNAL_EXPORT_TOKEN з Cloudflare.
 * 3. Запустити syncJournal() вручну (дати дозвіл), потім installTrigger() — і далі щогодини автоматично.
 */
const JOURNAL_URL = 'https://kamelchuk.org/api/sync/journal';

function syncJournal() {
  const token = PropertiesService.getScriptProperties().getProperty('JOURNAL_TOKEN');
  if (!token) throw new Error('Додайте JOURNAL_TOKEN у Script Properties');
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
