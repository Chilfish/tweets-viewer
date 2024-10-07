import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { Hono } from 'hono/tiny'
import { readJson } from './utils'

const imgData = await readJson<any[]>('D:/Downloads/tweet-data/ttisrn_0710/data-imgs.json', [])

const app = new Hono()

app.use(cors())

app.get('/', c => c.text('Hello World'))

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
app.get('/img', (c) => {
  const data = randomImg()
  return c.json(data)
})

serve({
  fetch: app.fetch,
  port: 8081,
})
