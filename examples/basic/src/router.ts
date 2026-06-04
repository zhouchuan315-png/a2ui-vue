import { createRouter, createWebHashHistory } from 'vue-router'
import BasicCatalogPage from './BasicCatalogPage.vue'
import CompositionComponentsPage from './CompositionComponentsPage.vue'
import JsonRendererPage from './JsonRendererPage.vue'
import UsageDocsPage from './UsageDocsPage.vue'
import RestaurantFinderPage from './RestaurantFinderPage.vue'
import A2aPlaygroundPage from './A2aPlaygroundPage.vue'

const routes = [
  { path: '/', name: 'basic', component: BasicCatalogPage },
  { path: '/composition', name: 'composition', component: CompositionComponentsPage },
  { path: '/json', name: 'json', component: JsonRendererPage },
  { path: '/docs', name: 'docs', component: UsageDocsPage },
  { path: '/restaurant', name: 'restaurant', component: RestaurantFinderPage },
  { path: '/a2a', name: 'a2a', component: A2aPlaygroundPage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
