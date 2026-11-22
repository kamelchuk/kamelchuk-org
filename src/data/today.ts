// Блоки правої колонки першого екрана.
// Відео дня: найновіше відео з YouTube-каналу (поки вручну; згодом — автоматично під час збірки).
// Фото дня: найновіше фото з Instagram (поки заглушка; потрібен доступ до Instagram API).
// Мої дії: 3 речення з Журналу подій (Юрій затверджує). Зараз — ЧЕРНЕТКА-приклад.
export const videoOfDay = {
  id: '6HaWC2J1TPs',
  // обкладинка — кадр з Юрієм із цього відео (вибрано вручну)
  cover: 'https://i.ytimg.com/vi/6HaWC2J1TPs/maxres2.jpg',
  title: { uk: 'Правковий тероризм: торгівля правками завжди буде. Ранок.LIVE', en: 'Amendment terrorism: the trade in amendments will always exist. Ranok.LIVE' },
};
export const photoOfDay = {
  // ТИМЧАСОВО: кадр із відео, поки немає посилання на фото з Instagram
  image: 'https://i.ytimg.com/vi/6HaWC2J1TPs/maxres3.jpg',
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

// ⚠ МАКЕТ: вигадана новина лише для демонстрації дизайну. Прибрати перед публікацією.
export const mockNews = {
  date: new Date('2026-11-21'),
  pillar: 'team' as const,
  title: {
    uk: 'Партія «Українська Нація» відкриває відбір кандидатів у регіонах',
    en: 'The Ukrainian Nation party opens candidate selection in the regions',
  },
  text: {
    uk: 'Стартував відкритий відбір кандидатів від партії «Українська Нація» в усіх областях. Ми шукаємо людей із досвідом у громадах, бізнесі та війську, які готові працювати за чіткими правилами. Кожен кандидат проходить співбесіду, перевірку репутації та підписує кодекс партії. Перші регіональні команди представимо вже в грудні.',
    en: 'Open selection of Ukrainian Nation party candidates has begun in every region. We are looking for people with experience in communities, business and the military who are ready to work by clear rules. Every candidate goes through an interview, a reputation check and signs the party code. The first regional teams will be presented in December.',
  },
};
