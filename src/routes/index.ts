import {
  type RouteRecordRaw,
  createRouter,
  createWebHistory,
} from 'vue-router'

import type { Component } from 'vue'
import { defineAsyncComponent, h } from 'vue'
import DefaultLayout from '../layouts/default.vue'

function useLayout(
  page: string,
  layout: Component = DefaultLayout,
): Component {
  return h(layout, null, {
    default: () => h(defineAsyncComponent(() => import(`../pages/${page}.vue`))),
  })
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: useLayout('index'),
  },
  {
    path: '/lsl',
    component: useLayout('lsl'),
  },
  {
    path: '/ttisrn_0710',
    component: useLayout('lsl'),
  },
  {
    path: '/memo',
    component: useLayout('memo'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
