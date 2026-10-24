import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import { getLastCommit } from 'git-last-commit'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import type { Plugin, PluginOption } from 'vite'

/**
 * MOBEI deployment: swap whole upstream components for our own versions in
 * src/mobei/ at resolve time. Works for relative and '@/' imports alike and
 * leaves the upstream files untouched, so merging upstream stays easy.
 */
const mobeiOverrides: Record<string, string> = {
  'src/components/Header/index.tsx': 'src/mobei/Header.tsx',
  'src/components/Footer/index.tsx': 'src/mobei/Footer.tsx',
  'src/components/DonateCard/index.tsx': 'src/mobei/Hidden.tsx',
  'src/pages/Typing/components/ResultScreen/AuthorButton.tsx': 'src/mobei/Hidden.tsx',
}
function mobeiOverridePlugin(): Plugin {
  const table = new Map(Object.entries(mobeiOverrides).map(([from, to]) => [path.resolve(__dirname, from), path.resolve(__dirname, to)]))
  return {
    name: 'mobei-overrides',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || source.startsWith('\0')) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved) return null
      return table.get(path.resolve(resolved.id.split('?')[0])) ?? null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const latestCommitHash = await new Promise<string>((resolve) => {
    return getLastCommit((err, commit) => (err ? 'unknown' : resolve(commit.shortHash)))
  })
  return {
    plugins: [
      mobeiOverridePlugin(),
      react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
      visualizer() as PluginOption,
      Icons({
        compiler: 'jsx',
        jsx: 'react',
        customCollections: {
          'my-icons': {
            xiaohongshu: () => fs.readFile('./src/assets/xiaohongshu.svg', 'utf-8'),
          },
        },
      }),
    ],
    build: {
      minify: true,
      outDir: 'build',
      sourcemap: false,
    },
    esbuild: {
      drop: mode === 'development' ? [] : ['console', 'debugger'],
    },
    define: {
      REACT_APP_DEPLOY_ENV: JSON.stringify(process.env.REACT_APP_DEPLOY_ENV),
      LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // MOBEI deployment: analytics become no-ops (see src/mobei/analytics-stub.ts)
        'mixpanel-browser': path.resolve(__dirname, 'src/mobei/analytics-stub.ts'),
        '@vercel/analytics/react': path.resolve(__dirname, 'src/mobei/analytics-stub.ts'),
        '@vercel/analytics': path.resolve(__dirname, 'src/mobei/analytics-stub.ts'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  }
})
