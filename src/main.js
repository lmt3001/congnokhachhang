import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Self-host font: không phụ thuộc CDN, font-display: swap có sẵn trong gói.
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-sans/700.css'
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/500.css'

import './assets/tokens.css'
import './assets/base.css'
import './composables/useTheme' // áp dụng theme trước khi mount, tránh nháy màu

import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
