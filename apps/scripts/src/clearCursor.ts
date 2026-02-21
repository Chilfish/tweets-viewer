import { writeFile } from 'node:fs/promises'
import { cursorPath } from './common'

await writeFile(cursorPath, '')
