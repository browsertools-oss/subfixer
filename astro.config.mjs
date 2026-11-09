import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://subfixer.example',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
