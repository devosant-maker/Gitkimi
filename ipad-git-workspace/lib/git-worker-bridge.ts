// lib/git-worker-bridge.ts

let worker: Worker | null = null;
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }>();

function getWorker() {
  if (!worker) {
    // Syntax Next.js (Webpack 5) untuk load Web Worker
    worker = new Worker(new URL('../workers/git.worker.ts', import.meta.url));
    
    worker.onmessage = (event) => {
      const { id, success, data, error } = event.data;
      const pending = pendingRequests.get(id);
      
      if (pending) {
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error));
        }
        pendingRequests.delete(id);
      }
    };
  }
  return worker;
}

/**
 * Fungsi utama untuk memanggil command Git dari UI
 */
export function runGitCommand(type: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(7); // Generate unique ID
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ id, type, payload });
  });
}
