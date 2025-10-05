// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'ngx-formwork',
      lastUpdated: true,
      logo: {
        src: './src/assets/icon.svg',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/TheNordicOne/ngx-formwork',
        },
      ],
      components: {
        SocialIcons: './src/components/ExtendedSocialIcons.astro',
      },
      sidebar: [
        {
          label: 'About',
          autogenerate: { directory: 'about' },
        },
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
});
