import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kamelchuk.org',
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
