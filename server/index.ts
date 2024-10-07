import { Hono } from 'hono'
import { cors } from 'hono/cors'

const isNode = process.env.IS_NODE === 'TRUE'
const staticUrl = isNode ? 'http://127.0.0.1:8080' : 'https://p.chilfish.top'

let imgData = [] as any[]

const app = new Hono()

app.use(cors())

app.get('/', c => c.text('Hello World'))

async function fetchImgData() {
  if (imgData.length)
    return

  imgData = await fetch(`${staticUrl}/tweet/data-imgs.json`).then(r => r.json()) as any[]
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
app.get('/img', async (c) => {
  await fetchImgData()
  const data = randomImg()
  return c.json(data)
})

app.get('/all', async (c) => {
  await fetchImgData()
  return c.json(imgData)
})

if (isNode) {
  const { serve } = await import('@hono/node-server')
  serve({
    fetch: app.fetch,
    port: 8787,
  })

  console.log('server running on http://localhost:8787')
}

export default {
  fetch: app.fetch,
  scheduled: async (batch, env) => {},
}
