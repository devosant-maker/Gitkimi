import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { getFS, ensureDir } from './fs'

const CORS_PROXY = process.env.NEXT_PUBLIC_GIT_CORS_PROXY || 'https://cors.isomorphic-git.org'

export interface GitStatusEntry {
  filepath: string
  head: number
  workdir: number
  stage: number
  status: 'unmodified' | 'modified' | 'added' | 'deleted' | 'unknown'
}

export interface GitAuthor {
  name: string
  email: string
}

export async function gitClone(url: string, dir: string, token?: string): Promise<void> {
  const pfs = getFS()
  await ensureDir(dir)

  await git.clone({
    fs: pfs,
    http,
    dir,
    url,
    corsProxy: CORS_PROXY,
    singleBranch: true,
    depth: 1,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    onProgress: (evt) => {
      console.log('Clone progress:', evt.phase, evt.loaded, evt.total)
    }
  })
}

export async function gitStatus(dir: string): Promise<GitStatusEntry[]> {
  const pfs = getFS()
  try {
    const matrix = await git.statusMatrix({ fs: pfs, dir })
    return matrix.map(([filepath, head, workdir, stage]): GitStatusEntry => ({
      filepath,
      head,
      workdir,
      stage,
      status: stage === 0 && workdir === 2 ? 'modified' :
              stage === 0 && workdir === 0 ? 'deleted' :
              stage === 1 && workdir === 1 ? 'unmodified' :
              stage === 2 && workdir === 2 ? 'added' :
              stage === 2 && workdir === 1 ? 'staged' :
              'unknown'
    }))
  } catch (e) {
    console.error('Git status error:', e)
    return []
  }
}

export async function gitAdd(dir: string, filepath: string): Promise<void> {
  const pfs = getFS()
  await git.add({ fs: pfs, dir, filepath })
}

export async function gitRemove(dir: string, filepath: string): Promise<void> {
  const pfs = getFS()
  await git.remove({ fs: pfs, dir, filepath })
}

export async function gitCommit(dir: string, message: string, author: GitAuthor): Promise<string> {
  const pfs = getFS()
  return await git.commit({
    fs: pfs,
    dir,
    message,
    author
  })
}

export async function gitPush(dir: string, token: string): Promise<void> {
  const pfs = getFS()
  await git.push({
    fs: pfs,
    http,
    dir,
    corsProxy: CORS_PROXY,
    remote: 'origin',
    ref: await gitCurrentBranch(dir),
    headers: { Authorization: `Bearer ${token}` },
    onProgress: (evt) => console.log('Push progress:', evt)
  })
}

export async function gitPull(dir: string, token: string): Promise<void> {
  const pfs = getFS()
  await git.pull({
    fs: pfs,
    http,
    dir,
    corsProxy: CORS_PROXY,
    remote: 'origin',
    ref: await gitCurrentBranch(dir),
    headers: { Authorization: `Bearer ${token}` },
    author: { name: 'iPad Git Workspace', email: 'workspace@ipad.dev' },
    singleBranch: true,
    fastForwardOnly: false
  })
}

export async function gitInit(dir: string): Promise<void> {
  const pfs = getFS()
  await ensureDir(dir)
  await git.init({ fs: pfs, dir, defaultBranch: 'main' })
}

export async function gitListBranches(dir: string): Promise<string[]> {
  const pfs = getFS()
  try {
    return await git.listBranches({ fs: pfs, dir, remote: 'origin' })
  } catch {
    return []
  }
}

export async function gitCurrentBranch(dir: string): Promise<string> {
  const pfs = getFS()
  try {
    return (await git.currentBranch({ fs: pfs, dir, fullname: false })) || 'main'
  } catch {
    return 'main'
  }
}

export async function gitLog(dir: string, depth: number = 20): Promise<any[]> {
  const pfs = getFS()
  try {
    return await git.log({ fs: pfs, dir, depth })
  } catch {
    return []
  }
}

export async function gitCheckout(dir: string, ref: string): Promise<void> {
  const pfs = getFS()
  await git.checkout({ fs: pfs, dir, ref })
}

export async function gitCreateBranch(dir: string, branch: string, checkout: boolean = true): Promise<void> {
  const pfs = getFS()
  await git.branch({ fs: pfs, dir, ref: branch, checkout })
}

export async function gitDeleteBranch(dir: string, branch: string): Promise<void> {
  const pfs = getFS()
  await git.deleteBranch({ fs: pfs, dir, ref: branch })
}