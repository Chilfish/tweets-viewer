import type { Component } from 'vue'

import { defineAsyncComponent, h } from 'vue'
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
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
    redirect: `/@ttisrn_0710`,
  },
  {
    path: '/@:name',
    component: useLayout('posts'),
  },
  {
    path: '/memo',
    component: useLayout('memo'),
  },
  {
    path: '/fans',
    component: useLayout('fans'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: useLayout('index'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
