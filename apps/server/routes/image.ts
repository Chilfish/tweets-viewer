import { Hono } from 'hono'
import { staticUrl } from '../common'

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
app.get('/get', async (c) => {
  await fetchImgData()
  const data = randomImg()
  if (!data)
    return c.json({ error: 'no image available' }, 404)
  return c.json(data)
})

app.get('/all', async (c) => {
  await fetchImgData()
  return c.json(imgData)
})
app.get('/update', async (c) => {
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
