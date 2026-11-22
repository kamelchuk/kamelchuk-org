// Блоки правої колонки першого екрана.
// Відео дня: найновіше відео з YouTube-каналу (поки вручну; згодом — автоматично під час збірки).
// Фото дня: найновіше фото з Instagram (поки заглушка; потрібен доступ до Instagram API).
// Мої дії: 3 речення з Журналу подій (Юрій затверджує). Зараз — ЧЕРНЕТКА-приклад.
export const videoOfDay = {
  id: 'o6IpIoEQai4',
  title: { uk: 'Відносини між Україною та Польщею', en: 'Relations between Ukraine and Poland' },
};
export const photoOfDay = {
  image: '', // URL найновішого фото з Instagram
  caption: { uk: 'Найновіше фото з Instagram', en: 'Latest photo from Instagram' },
};
export const myActions = {
  draft: true,
  week: { uk: 'Цього тижня', en: 'This week' },
  items: {
    uk: [
      'Приклад: провів прийом громадян у приймальні в Шептицькому.',
      'Приклад: виступив на засіданні енергетичного комітету щодо тарифів.',
      'Приклад: зустрівся з командою партії щодо відбору кандидатів у регіонах.',
    ],
    en: [
      'Example: held a public reception at the Sheptytskyi office.',
      'Example: spoke at the energy committee on tariffs.',
      'Example: met the party team on selecting regional candidates.',
    ],
  },
};
