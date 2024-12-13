import { Hono } from 'hono'
import { staticUrl } from '../../common'

const app = new Hono()

let config = [] as any[]
async function getConfig() {
  if (config.length) {
    return config
  }
  config = await fetch(`${staticUrl}/tweet/versions.json`)
    .then(r => r.json())
    .catch(() => [])
}

app.get('/', async (c) => {
  await getConfig()
  return c.json(config)
})

export default app
