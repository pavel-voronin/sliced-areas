import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Sliced Areas',
  description: 'Blender-like resizable and splittable areas layout system',
  base: '/sliced-areas/',

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag: string) => tag === 'sliced-areas',
      },
    },
  },

  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/installation' },
      { text: 'API Reference', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/pavel-voronin/sliced-areas' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Core Concepts', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'Web Components', link: '/guide/web-components' },
            { text: 'Vue 3', link: '/guide/vue' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Web Component API', link: '/api/web-component' },
            { text: 'Vue Component API', link: '/api/vue' },
            { text: 'TypeScript Types', link: '/api/types' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/pavel-voronin/sliced-areas' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/pavel-voronin/sliced-areas/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Pavel Voronin',
    },
  },

  head: [['link', { rel: 'icon', href: '/sliced-areas/favicon.ico' }]],
})
