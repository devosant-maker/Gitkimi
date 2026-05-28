import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path)
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    py: 'python', html: 'html', css: 'css', scss: 'scss', sass: 'sass',
    json: 'json', md: 'markdown', mdx: 'markdown',
    rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c', h: 'c',
    swift: 'swift', kt: 'kotlin', dart: 'dart',
    xml: 'xml', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    sql: 'sql', prisma: 'prisma', graphql: 'graphql', gql: 'graphql',
    dockerfile: 'dockerfile', env: 'ini'
  }
  return map[ext] || 'plaintext'
}