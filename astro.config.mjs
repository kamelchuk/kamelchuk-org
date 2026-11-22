import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kamelchuk.org.ua',
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
