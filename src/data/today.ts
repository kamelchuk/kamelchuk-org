// Блоки правої колонки першого екрана.
// Відео дня: найновіше відео з YouTube-каналу (поки вручну; згодом — автоматично під час збірки).
// Фото дня: найновіше фото з Instagram (поки заглушка; потрібен доступ до Instagram API).
// Мої дії: 3 речення з Журналу подій (Юрій затверджує). Зараз — ЧЕРНЕТКА-приклад.
export const videoOfDay = {
  id: '6HaWC2J1TPs',
  // обкладинка — кадр з Юрієм із цього відео (вибрано вручну)
  cover: '/images/video-of-day.jpg',
  title: { uk: 'Правковий тероризм: торгівля правками завжди буде. Ранок.LIVE', en: 'Amendment terrorism: the trade in amendments will always exist. Ranok.LIVE' },
};
export const photoOfDay = {
  // фото з Instagram (вибрав Юрій): https://www.instagram.com/p/CdGM9B3NlM9/
  image: '/images/photo-of-day.jpg',
  link: 'https://www.instagram.com/p/CdGM9B3NlM9/',
  caption: { uk: 'Найновіше фото з Instagram', en: 'Latest photo from Instagram' },
};
export const myActions = {
  // 3 речення з Журналу подій, затверджені Юрієм. Порожньо — блок не показується.
  week: { uk: 'Цього тижня', en: 'This week' },
  items: { uk: [] as string[], en: [] as string[] },
};
