import type React from 'react'
import IconMail from '~icons/material-symbols/mail'
import IconGithub from '~icons/simple-icons/github'

/**
 * MOBEI deployment footer — replaces src/components/Footer via the override
 * plugin in vite.config.ts. Keeps the GPL attribution to the original project;
 * drops the upstream donation, community, VSCode and mirror panels.
 */
const linkClass = 'cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'

const Footer: React.FC = () => {
  return (
    <footer className="mb-1 mt-4 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm ease-in">
      <a href="https://mobei.win" target="_blank" rel="noreferrer" className={linkClass}>
        由 MOBEI 部署
      </a>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <a
        href="https://github.com/RealKai42/qwerty-learner"
        target="_blank"
        rel="noreferrer"
        className={`${linkClass} inline-flex items-center gap-1`}
      >
        <IconGithub fontSize={13} />
        基于开源项目 Qwerty Learner（作者 Kaiyi）· GPL-3.0
      </a>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <a
        href="mailto:6600801@gmail.com?subject=MOBEI%20Typing%20%E5%8F%8D%E9%A6%88"
        className={`${linkClass} inline-flex items-center gap-1`}
      >
        <IconMail fontSize={14} />
        问题反馈
      </a>
      <span className="select-none rounded bg-slate-200 px-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        Build <span className="select-all">{LATEST_COMMIT_HASH}</span>
      </span>
    </footer>
  )
}

export default Footer
