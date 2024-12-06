import { Hono } from 'hono'
import { staticUrl } from '../common'

const app = new Hono()

let imgData = [] as any[]

async function fetchImgData() {
  if (imgData.length)
    return
  imgData = await fetch(`${staticUrl}/tweet/imgs.json`)
    .then(r => r.json())
    .catch(() => [])
}

function randomImg() {
  const randomIndex = Math.floor(Math.random() * imgData.length)
  const data = imgData[randomIndex]
  if (!data.urls)
    return randomImg()

  data.url = data.urls[Math.floor(Math.random() * data.urls.length)]
  delete data.urls
  return data
}

// random
app.get('/get', async (c) => {
  await fetchImgData()
  const data = randomImg()
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
