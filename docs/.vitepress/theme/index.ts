import DefaultTheme from 'vitepress/theme'
import './style.css'
import HomeShowcase from '../components/HomeShowcase.vue'
import WebComponentBasicDemo from '../components/WebComponentBasicDemo.vue'
import WebComponentActionsDemo from '../components/WebComponentActionsDemo.vue'
import WebComponentLayoutsDemo from '../components/WebComponentLayoutsDemo.vue'
import WebComponentOperationsDemo from '../components/WebComponentOperationsDemo.vue'
import VueBasicDemo from '../components/VueBasicDemo.vue'
import VueLayoutsDemo from '../components/VueLayoutsDemo.vue'
import VueOperationsDemo from '../components/VueOperationsDemo.vue'
import VueActionsDemo from '../components/VueActionsDemo.vue'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register interactive demo components
    app.component('HomeShowcase', HomeShowcase)
    app.component('WebComponentBasicDemo', WebComponentBasicDemo)
    app.component('WebComponentActionsDemo', WebComponentActionsDemo)
    app.component('WebComponentLayoutsDemo', WebComponentLayoutsDemo)
    app.component('WebComponentOperationsDemo', WebComponentOperationsDemo)
    app.component('VueBasicDemo', VueBasicDemo)
    app.component('VueLayoutsDemo', VueLayoutsDemo)
    app.component('VueOperationsDemo', VueOperationsDemo)
    app.component('VueActionsDemo', VueActionsDemo)
  }
} satisfies Theme
