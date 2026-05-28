// workers/git.worker.ts
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';

// Inisialisasi File System di dalam Worker (IndexedDB bisa diakses dari worker)
const fs = new LightningFS('gitkimi-fs');

type WorkerMessage = {
  id: string;
  type: 'STATUS' | 'PULL' | 'PUSH' | 'CLONE' | 'COMMIT';
  payload: any;
};

type WorkerResponse = {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
};

// Dengarkan pesan dari Main Thread (UI)
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  let response: WorkerResponse = { id, success: true };

  try {
    if (type === 'STATUS') {
      const matrix = await git.statusMatrix({ fs, dir: payload.dir });
      response.data = matrix;
    } 
    else if (type === 'PULL') {
      await git.pull({
        fs,
        http,
        dir: payload.dir,
        ref: payload.ref,
        singleBranch: true,
        author: payload.author,
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      response.data = { message: 'Pull successful' };
    } 
    else if (type === 'PUSH') {
      await git.push({
        fs,
        http,
        dir: payload.dir,
        ref: payload.ref,
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      response.data = { message: 'Push successful' };
    }
    // Tambahkan command lain (COMMIT, CLONE, dll) di sini sesuai kebutuhan
  } catch (error: any) {
    response.success = false;
    response.error = error.message || 'Unknown error in worker';
    console.error('[Git Worker Error]', error);
  }

  // Kirim hasil balik ke Main Thread
  self.postMessage(response);
};
