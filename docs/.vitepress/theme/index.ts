import DefaultTheme from 'vitepress/theme'
import './style.css'
import WebComponentExample from '../components/WebComponentExample.vue'
import VueComponentExample from '../components/VueComponentExample.vue'
import SimpleExample from '../components/SimpleExample.vue'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register interactive demo components
    app.component('WebComponentExample', WebComponentExample)
    app.component('VueComponentExample', VueComponentExample)
    app.component('SimpleExample', SimpleExample)
  }
} satisfies Theme
