import type { Component } from 'vue'

import type { RouteRecordRaw } from 'vue-router'
import { defineAsyncComponent, h } from 'vue'
import {
  createRouter,
  createWebHistory,

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

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: useLayout('index'),
  },
  // {
  //   path: '/remote',
  //   component: useLayout('remote', DefaultLayout, true),
  // },
  {
    path: '/@:name',
    component: useLayout('posts'),
  },
  {
    path: '/@:name/memo',
    component: useLayout('memo'),
  },
  {
    path: '/@:name/pic',
    name: 'daily-pic',
    component: useLayout(
      'pic',
      defineAsyncComponent(() => import('../layouts/pic.vue')),
    ),
  },
  {
    path: '/test',
    component: useLayout('test'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
  {
    path: '/lsl',
    redirect: `/@ttisrn_0710`,
  },
  {
    path: '/memo',
    redirect: `/@ttisrn_0710/memo`,
  },
  {
    path: '/likes',
    redirect: '/remote?url=https://p.chilfish.top/tweet/likes.json',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
