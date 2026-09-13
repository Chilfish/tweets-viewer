import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { staticUrl } from '../common'
import { errorResponse, jsonResponse } from '../utils/openapi'

const app = new Hono()

let imgData = [] as any[]

async function fetchImgData() {
  if (imgData.length)
    return
  imgData = await fetch(`${staticUrl}/tweet/imgs.json`)
    .then(r => r.json() as Promise<any[]>)
    .catch(() => [])
}

function randomImg() {
  // 只从有 urls 的数据中随机选，避免无限递归
  const candidates = imgData.filter(d => d.urls?.length > 0)
  if (!candidates.length)
    return null

  const data = candidates[Math.floor(Math.random() * candidates.length)]
  const url = data.urls[Math.floor(Math.random() * data.urls.length)]

  return { ...data, url, urls: undefined }
}

// random
app.get('/get', describeRoute({
  tags: ['Image'],
  summary: '获取随机图片',
  responses: {
    200: jsonResponse('随机图片条目', 'ImageRandom'),
    404: errorResponse,
  },
}), async (c) => {
  await fetchImgData()
  const data = randomImg()
  if (!data)
    return c.json({ error: 'no image available' }, 404)
  return c.json(data)
})

app.get('/all', describeRoute({
  tags: ['Image'],
  summary: '获取所有图片',
  responses: {
    200: jsonResponse('图片数据数组', 'ImageList'),
  },
}), async (c) => {
  await fetchImgData()
  return c.json(imgData)
})
app.get('/update', describeRoute({
  tags: ['Image'],
  summary: '刷新图片缓存',
  responses: {
    200: jsonResponse('缓存刷新结果', 'ImageUpdateResult'),
  },
}), async (c) => {
  await fetchImgData()

  if (!imgData.length) {
    return c.json({
      success: false,
      message: 'no data',
    })
  }

  return c.json({
    success: true,
    size: imgData.length,
  })
})

export default app
