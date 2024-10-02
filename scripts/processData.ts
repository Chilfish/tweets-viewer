import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execASync = promisify(exec)
const cwd = process.cwd()
const args = process.argv.slice(2)

console.log('Running scripts...', { args, cwd })

async function run(name: string) {
  return execASync(`tsx ${cwd}/scripts/${name}.ts ${args.join(' ')}`)
    .then(({ stdout, stderr }) => {
      console.log(stdout)
      console.error(stderr)
    })
}

await run('filterData')

await run('hash')
