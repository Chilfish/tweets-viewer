import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../')
const cacheDir = path.join(rootDir, 'cache')

export async function writeJson(data: any, filePath: string): Promise<void> {
  const destPath = path.join(cacheDir, filePath)
  await writeFile(destPath, JSON.stringify(data, null, 2), 'utf8')
}
