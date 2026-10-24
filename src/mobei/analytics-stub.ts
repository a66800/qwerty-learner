/**
 * MOBEI deployment: no-op stand-ins for the upstream analytics libraries.
 * vite.config.ts aliases `mixpanel-browser`, `@vercel/analytics` and
 * `@vercel/analytics/react` here, so the upstream source stays untouched
 * (easy merges) while nothing is sent to the original author's accounts.
 */
const noop = (..._args: unknown[]) => undefined

const mixpanel = {
  init: noop,
  track: noop,
  identify: noop,
  register: noop,
  reset: noop,
  people: { set: noop, set_once: noop, increment: noop },
}

export default mixpanel
export const track = noop
export const inject = noop
export const Analytics = () => null
