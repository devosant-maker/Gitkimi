// hooks/useGitActions.ts
import { useSession } from "next-auth/react";
import { runGitCommand } from "@/lib/git-worker-bridge";
import { useStore } from "@/lib/store";
import { GitFileStatus } from "@/lib/store";

export function useGitActions() {
  const { data: session } = useSession();
  const { setLoading, setGitStatus, setCurrentBranch } = useStore();

  // Path default repo kamu di LightningFS (sesuaikan kalau beda)
  const DIR = '/workspace'; 

  // Helper untuk data yang selalu dipakai (Token & Author)
  const getAuthPayload = () => ({
    dir: DIR,
    token: session?.accessToken,
    author: {
      name: session?.user?.name || 'iPad User',
      email: session?.user?.email || 'user@ipad.dev',
    },
  });

  // 1. FUNGSI PULL
  const pullRepo = async () => {
    setLoading(true);
    try {
      await runGitCommand('PULL', { 
        ...getAuthPayload(), 
        ref: 'main' // Atau 'master' tergantung default branch kamu
      });
      await refreshStatus(); // Auto refresh status setelah pull
      alert('✅ Pull berhasil!');
    } catch (err: any) {
      console.error(err);
      alert('❌ Gagal Pull: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNGSI PUSH
  const pushRepo = async () => {
    setLoading(true);
    try {
      await runGitCommand('PUSH', { 
        ...getAuthPayload(), 
        ref: 'main' 
      });
      alert('✅ Push berhasil!');
    } catch (err: any) {
      console.error(err);
      alert('❌ Gagal Push: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNGSI CEK STATUS (Untuk update panel Git)
  const refreshStatus = async () => {
    try {
      // Panggil worker untuk dapetin matrix status
      const matrix = await runGitCommand('STATUS', { dir: DIR });
      
      // Parse matrix isomorphic-git ke format GitFileStatus Zustand
      // Format matrix: [filepath, head, workdir, stage]
      const parsedStatus: GitFileStatus[] = matrix.map((row: any[]) => {
        const [filepath, head, workdir, stage] = row;
        let status: string = 'unmodified';
        
        if (head === 0 && workdir === 2) status = 'added';
        else if (head === 1 && workdir === 0) status = 'deleted';
        else if (head === 1 && workdir === 2) status = 'modified';
        
        return { filepath, status, stage };
      });

      setGitStatus(parsedStatus);
    } catch (err) {
      console.error('Gagal refresh status:', err);
    }
  };

  return { pullRepo, pushRepo, refreshStatus };
}
