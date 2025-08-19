import type { Component } from 'vue'

import { defineAsyncComponent, h } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/default.vue'
import RemoteLayout from '../layouts/remote.vue'

function useLayout(page: string, layout: Component = DefaultLayout): Component {
  return h(layout, () =>
    h(defineAsyncComponent(() => import(`../pages/${page}.vue`))),
  )
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: useLayout('index'),
  },
  {
    path: '/remote',
    name: 'remote',
    component: h(
      RemoteLayout,
      h(defineAsyncComponent(() => import('../pages/remote.tsx'))),
    ),
  },
  {
    path: '/@:name/',
    name: 'user-posts',
    component: useLayout('posts'),
  },
  {
    path: '/@:name/memo',
    name: 'user-memo',
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
    name: 'test',
    component: useLayout('test'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
  {
    path: '/lsl',
    redirect: '/@ttisrn_0710',
  },
  {
    path: '/memo',
    redirect: '/@ttisrn_0710/memo',
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
