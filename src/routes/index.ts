import type { Component } from 'vue'

import { defineAsyncComponent, h } from 'vue'
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { useTweetStore } from '~/stores/tweets'
import DefaultLayout from '../layouts/default.vue'

function useLayout(
  page: string,
  layout: Component = DefaultLayout,
  tsx = false,
): Component {
  return h(
    layout,
    h(defineAsyncComponent(() => import(`../pages/${page}.${tsx ? 'tsx' : 'vue'}`))),
  )
}

function useDefaultRoute(name = '', tsx = false) {
  return {
    path: `/${name}`,
    name: name || 'index',
    component: useLayout(name || 'index', DefaultLayout, tsx),
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  useDefaultRoute(),
  useDefaultRoute('remote', true),
  {
    path: '/@:name',
    component: useLayout('posts'),
    beforeEnter: (to, _from, next) => {
      const tweetStore = useTweetStore()
      const name = to.params.name as string
      tweetStore.initTweets(name).then(() => {
        next()
      })
    },
  },
  {
    path: '/@:name/memo',
    component: useLayout('memo'),
    beforeEnter: (to, _from, next) => {
      const tweetStore = useTweetStore()
      const name = to.params.name as string
      tweetStore.initTweets(name).then(() => {
        next()
      })
    },
  },
  {
    path: '/@:name/pic',
    name: 'daily-pic',
    component: h(
      defineAsyncComponent(() => import('../layouts/pic.vue')),
      h(defineAsyncComponent(() => import('../pages/pic.vue'))),
    ),
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
