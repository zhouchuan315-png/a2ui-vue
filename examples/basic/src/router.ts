import { createRouter, createWebHashHistory } from 'vue-router'
import BasicCatalogPage from './BasicCatalogPage.vue'
import CompositionComponentsPage from './CompositionComponentsPage.vue'
import JsonRendererPage from './JsonRendererPage.vue'
import UsageDocsPage from './UsageDocsPage.vue'
import RestaurantFinderPage from './RestaurantFinderPage.vue'

const routes = [
  { path: '/', name: 'basic', component: BasicCatalogPage },
  { path: '/composition', name: 'composition', component: CompositionComponentsPage },
  { path: '/json', name: 'json', component: JsonRendererPage },
  { path: '/docs', name: 'docs', component: UsageDocsPage },
  { path: '/restaurant', name: 'restaurant', component: RestaurantFinderPage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
