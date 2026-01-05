import { mkdir, copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const source = resolve('src/plugin/styles.css')
const destination = resolve('dist/styles.css')

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)
