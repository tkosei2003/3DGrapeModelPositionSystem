import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pagesで公開する際のベースパス
  // リポジトリ名: 3DGrapeModelPositionSystem
  base: '/3DGrapeModelPositionSystem/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    
    // Three.jsの大きなファイルサイズに対する警告を無効化
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  
  // 開発サーバーの設定
  server: {
    host: true,
    port: 3000
  }
})
