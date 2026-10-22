import { readFile, writeFile } from 'node:fs/promises'

interface ClashProxy {
  name: string
  server?: string
  type?: string
}

interface ClashConfig {
  proxies?: ClashProxy[]
  dns?: {
    'nameserver-policy'?: Record<string, string | string[]>
    [key: string]: unknown
  }
  ipv6?: boolean
  udp?: boolean
}

const PREFERRED_NODES = ['香港HK-A', '香港HKT-A', '香港HK-HY2']
const HK_NODE = /香港|HK/i
const PSEUDO_NODE = /剩余流量|套餐到期/

function pickNode(nodes: ClashProxy[]) {
  const preferred = PREFERRED_NODES.find(name => nodes.some(node => node.name === name))
  if (preferred)
    return preferred

  const candidates = nodes.filter(node => HK_NODE.test(node.name) && !PSEUDO_NODE.test(node.name))
  const fast = candidates.find(node => node.type === 'anytls' || node.type === 'hysteria2')
  const picked = fast ?? candidates[0]
  if (!picked)
    throw new Error('订阅里没有可用的香港节点')
  return picked.name
}

/**
 * 订阅里的 nameserver-policy 只覆盖部分节点域名；节点域名换掉后，
 * runner 用默认 DNS 可能解析不到。把本次选中的节点域名补进同一组 DoH。
 */
function extendNameserverPolicy(dns: ClashConfig['dns'], servers: string[]) {
  const policy = dns?.['nameserver-policy']
  if (!policy)
    return

  const doh = Object.values(policy).flat()
  if (!doh.length)
    return

  const covered = new Set(Object.keys(policy).flatMap(key => key.split(',')))
  const missing = [...new Set(servers)].filter(server => server && !covered.has(server))
  if (missing.length)
    policy[missing.join(',')] = doh
}

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  console.error('Usage: bun run prepareMihomo.ts <subscription.yaml> <config.yaml>')
  process.exit(1)
}

const source = Bun.YAML.parse(await readFile(inputPath, 'utf8')) as ClashConfig | null
const proxies = (source?.proxies ?? []).filter(node => HK_NODE.test(node.name) && !PSEUDO_NODE.test(node.name))
if (!proxies.length)
  throw new Error('订阅里没有可用的香港节点')

const proxyNode = pickNode(proxies)
extendNameserverPolicy(source?.dns, proxies.map(node => node.server ?? ''))

const config = {
  'mixed-port': 7890,
  'allow-lan': false,
  'mode': 'rule',
  'log-level': 'info',
  'unified-delay': true,
  'external-controller': '127.0.0.1:9099',
  'ipv6': source?.ipv6 ?? true,
  'udp': source?.udp ?? true,
  'dns': source?.dns,
  'proxies': proxies,
  'proxy-groups': [{ name: 'PICK', type: 'select', proxies: proxies.map(node => node.name) }],
  'rules': ['MATCH,PICK'],
}

// JSON 是合法的 YAML，缩进输出比 Bun.YAML.stringify 的 flow 风格更便于排查。
await writeFile(outputPath, JSON.stringify(config, null, 2), 'utf8')
await writeFile(`${outputPath}.proxy-node`, proxyNode, 'utf8')
console.log(`mihomo config ready: ${proxies.length} HK node(s), default ${proxyNode}`)
