import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { NOINDEX } from './src/noindex.mjs';

export default defineConfig({
  site: 'https://subfixer.app',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') && !NOINDEX.some((s) => page.endsWith('/' + s + '/')) })],
});
