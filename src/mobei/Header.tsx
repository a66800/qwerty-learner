import MobeiMark from './MobeiMark'
import type { PropsWithChildren } from 'react'
import type React from 'react'
import { NavLink } from 'react-router-dom'

/**
 * MOBEI deployment header — replaces src/components/Header via the override
 * plugin in vite.config.ts. Same layout as upstream; the brand stays on this site.
 */
const Header: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <header className="container z-20 mx-auto w-full px-10 py-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-3 no-underline hover:no-underline" aria-label="MOBEI Typing 首页">
            <MobeiMark height={34} />
            <span className="flex flex-col leading-none">
              <span className="text-2xl font-bold tracking-wide text-gray-800 dark:text-gray-100 lg:text-3xl">
                MOBEI <span className="text-indigo-500">Typing</span>
              </span>
              <span className="mt-1.5 text-xs font-normal tracking-normal text-gray-400">打字背单词 · 基于 Qwerty Learner</span>
            </span>
          </NavLink>
          <a
            href="https://mobei.win"
            className="hidden rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-gray-700 dark:text-gray-400 lg:inline-block"
          >
            mobei.win ↗
          </a>
        </div>
        <nav className="my-card on element flex w-auto content-center items-center justify-end space-x-3 rounded-xl bg-white p-4 transition-colors duration-300 dark:bg-gray-800">
          {children}
        </nav>
      </div>
    </header>
  )
}

export default Header
