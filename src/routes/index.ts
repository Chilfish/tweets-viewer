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
  return h(
    layout,
    h(defineAsyncComponent(() => import(`../pages/${page}.vue`))),
  )
}

function useDefaultRoute(name = '') {
  return {
    path: `/${name}`,
    name: name || 'index',
    component: useLayout(name || 'index'),
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  useDefaultRoute(),
  {
    path: '/@:name',
    component: useLayout('posts'),
  },
  {
    path: '/@:name/memo',
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
  // {
  //   path: '/test',
  //   component: useLayout('test'),
  // },
  {
    path: '/lsl',
    redirect: `/@ttisrn_0710`,
  },
  {
    path: '/memo',
    redirect: `/@ttisrn_0710/memo`,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
