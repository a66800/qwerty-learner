/**
 * MOBEI: load MOBEI Words (D:\dev\mobei-words\dist) in a sandbox, using the same
 * browser stubs as Words' own tests, so word lists and 核心意思 come from Words'
 * own logic (coreFor) rather than a re-implementation.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

export function loadWords(distDir) {
  const doc = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
  const el = (id) => ({ id, value: '', textContent: '', innerHTML: '', style: {}, dataset: {}, files: [], querySelectorAll: () => [], attributes: {}, open: false,
    classList: { toggle() {}, add() {}, remove() {} }, listeners: {}, addEventListener() {}, showModal() {}, close() {}, click() {}, focus() {}, setAttribute() {}, setCustomValidity() {}, reportValidity() {} })
  const elements = new Map()
  const document = { documentElement: { dataset: {}, style: {} }, getElementById: (id) => elements.get(id) ?? (elements.set(id, el(id)), elements.get(id)),
    querySelector: () => el('q'), querySelectorAll: () => [], createElement: () => el('c'), addEventListener() {} }
  const store = new Map()
  const localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size } }
  const context = vm.createContext({ document, localStorage, console: { log() {}, warn() {}, error() {} }, confirm: () => true, setTimeout: (fn) => fn(), requestAnimationFrame: (fn) => fn(),
    getSelection: () => null, Date, Blob, URL, navigator: { userAgent: 'node', maxTouchPoints: 0 }, matchMedia: () => ({ matches: false, addEventListener() {} }),
    speechSynthesis: { getVoices: () => [], speak() {}, cancel() {}, onvoiceschanged: null }, SpeechSynthesisUtterance: function (t) { this.text = t } })
  const loaded = new Set()
  for (const m of doc.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    if (m[1].startsWith('vendor/') || loaded.has(m[1])) continue
    loaded.add(m[1])
    vm.runInContext(fs.readFileSync(path.join(distDir, m[1]), 'utf8'), context, { filename: m[1] })
  }
  return (expr) => vm.runInContext(expr, context)
}
