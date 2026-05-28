import LightningFS from '@isomorphic-git/lightning-fs'

let fsInstance: LightningFS | null = null
let pfsInstance: any = null

export async function initFS(): Promise<{ fs: any }> {
  if (fsInstance && pfsInstance) {
    return { fs: pfsInstance }
  }

  try {
    fsInstance = new LightningFS('git-workspace-fs', {
      wipe: false,
      url: undefined
    })
    pfsInstance = fsInstance.promises

    await pfsInstance.mkdir('/repos', { recursive: true }).catch(() => {})
    await pfsInstance.mkdir('/workspace', { recursive: true }).catch(() => {})

    return { fs: pfsInstance }
  } catch (error) {
    console.error('Failed to initialize LightningFS:', error)
    throw new Error('File system initialization failed')
  }
}

export function getFS(): any {
  if (!pfsInstance) {
    throw new Error('File system not initialized. Call initFS() first.')
  }
  return pfsInstance
}

export async function ensureDir(dir: string): Promise<void> {
  const fs = getFS()
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (e) {
    // Directory might already exist
  }
}

export async function fileExists(path: string): Promise<boolean> {
  const fs = getFS()
  try {
    await fs.stat(path)
    return true
  } catch {
    return false
  }
}

export async function readFileSafe(path: string): Promise<string> {
  const fs = getFS()
  try {
    return await fs.readFile(path, { encoding: 'utf8' })
  } catch (e) {
    return ''
  }
}

export async function writeFileSafe(path: string, content: string | Uint8Array): Promise<void> {
  const fs = getFS()
  const dir = path.substring(0, path.lastIndexOf('/'))
  if (dir && dir !== path) {
    await ensureDir(dir)
  }
  await fs.writeFile(path, content)
}

export async function deleteFileSafe(path: string): Promise<void> {
  const fs = getFS()
  try {
    await fs.unlink(path)
  } catch (e) {
    console.warn('Failed to delete file:', path)
  }
}

export async function readDirSafe(path: string): Promise<string[]> {
  const fs = getFS()
  try {
    return await fs.readdir(path)
  } catch {
    return []
  }
}