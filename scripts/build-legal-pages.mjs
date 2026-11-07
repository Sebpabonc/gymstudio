#!/usr/bin/env node
// Builds the public legal pages (privacy, terms, support) from the PO-approved Markdown in
// docs/governance/app-store/ into public/<page>/index.html (English) and public/<page>/es/index.html,
// served on GitHub Pages at https://sebpabonc.github.io/gymstudio/<page>/ and .../<page>/es/.
// Never hand-edit the HTML.
//   node scripts/build-legal-pages.mjs          write the pages
//   node scripts/build-legal-pages.mjs --check  fail if a page is out of date (CI)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SITE = 'https://sebpabonc.github.io/gymstudio'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'docs/governance/app-store')
const out = join(root, 'public')

const PAGES = [
  { slug: 'privacy', file: 'privacy-policy', title: { en: 'Privacy Policy', es: 'Política de privacidad' } },
  { slug: 'terms', file: 'terms', title: { en: 'Terms of Use', es: 'Términos de uso' } },
  { slug: 'support', file: 'support-page', title: { en: 'Support', es: 'Soporte' } },
  // The US consumer health data policy is added once the PO decides on the US launch (questions-for-po.md).
]
const LANGS = ['en', 'es']

/** Public URL of a page: English at /<page>/, Spanish at /<page>/es/. */
const pageUrl = (slug, lang) => `${SITE}/${slug}/${lang === 'es' ? 'es/' : ''}`

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inline(text) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href.replace(/"/g, '%22')}">${label}</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, '$1<a href="$2">$2</a>')
    .replace(/(^|[\s(>])([a-z0-9.+-]+@[a-z0-9-]+\.[a-z.]+[a-z])/gi, '$1<a href="mailto:$2">$2</a>')
}

/** Minimal Markdown for the governance docs: headings, paragraphs, lists, tables, quotes, rules. */
export function markdownToHtml(markdown) {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const html = []
  let paragraph = []
  let list = null
  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.type}>`)
    list = null
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trimEnd()
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (!line.trim()) { flushParagraph(); flushList(); continue }
    if (heading) { flushParagraph(); flushList(); html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); continue }
    if (/^-{3,}$/.test(line.trim())) { flushParagraph(); flushList(); html.push('<hr>'); continue }
    if (line.startsWith('|')) {
      flushParagraph(); flushList()
      const rows = []
      while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(lines[index++].trim())
      index -= 1
      const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
      const body = rows.filter((row) => !/^\|[\s:|-]+\|$/.test(row))
      const [head, ...rest] = body
      html.push(`<div class="table"><table><thead><tr>${cells(head).map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${
        rest.map((row) => `<tr>${cells(row).map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    if (line.startsWith('>')) { flushParagraph(); flushList(); html.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`); continue }
    if (bullet || numbered) {
      flushParagraph()
      const type = bullet ? 'ul' : 'ol'
      if (list && list.type !== type) flushList()
      list ??= { type, items: [] }
      list.items.push((bullet ?? numbered)[1])
      continue
    }
    if (list && /^\s{2,}\S/.test(lines[index])) { list.items[list.items.length - 1] += ` ${line.trim()}`; continue }
    flushList()
    paragraph.push(line.trim())
  }
  flushParagraph(); flushList()
  return html.join('\n')
}

function page({ slug, title }, lang, body) {
  const other = lang === 'en' ? 'es' : 'en'
  const links = PAGES.filter((item) => item.slug !== 'health-data' || slug === 'health-data')
    .map((item) => `<a href="${pageUrl(item.slug, lang)}"${item.slug === slug ? ' aria-current="page"' : ''}>${item.title[lang]}</a>`).join('')
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title[lang]} · GymStudio</title>
<link rel="alternate" hreflang="${other}" href="${pageUrl(slug, other)}">
<style>
:root { color-scheme: dark; --bg: #0f0f10; --panel: #1b1b1d; --line: rgba(255,255,255,.12); --text: #f3f3f1; --muted: #c8c7c4; --brand: #c99ca1; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 500 15px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, Arial, sans-serif; }
header, main, footer { max-width: 720px; margin: 0 auto; padding: 0 16px; }
header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding-top: 20px; }
.brand { font-weight: 800; letter-spacing: .02em; color: var(--text); text-decoration: none; }
nav { display: flex; flex-wrap: wrap; gap: 6px; }
nav a, .lang { padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 13px; text-decoration: none; }
nav a[aria-current="page"] { color: var(--text); border-color: var(--brand); }
main { padding-top: 8px; padding-bottom: 32px; }
h1 { font-size: 28px; line-height: 34px; margin: 24px 0 12px; }
h2 { font-size: 17px; line-height: 22px; margin: 28px 0 8px; }
h3, h4 { font-size: 15px; margin: 20px 0 6px; }
p, li { color: var(--muted); }
strong { color: var(--text); }
a { color: var(--brand); }
code { font-size: 13px; }
blockquote { margin: 12px 0; padding: 12px 16px; border-left: 3px solid var(--brand); background: var(--panel); border-radius: 12px; color: var(--muted); }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
th, td { padding: 8px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; color: var(--muted); }
th { color: var(--text); }
hr { border: 0; border-top: 1px solid var(--line); margin: 24px 0; }
footer { padding-bottom: 32px; color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
<header>
<a class="brand" href="${SITE}/">GYM STUDIO</a>
<a class="lang" href="${pageUrl(slug, other)}" hreflang="${other}">${other === 'es' ? 'Español' : 'English'}</a>
</header>
<header><nav aria-label="${lang === 'es' ? 'Páginas legales' : 'Legal pages'}">${links}</nav></header>
<main>
${body}
</main>
<footer>GymStudio · <a href="mailto:gymstudioapp@gmail.com">gymstudioapp@gmail.com</a></footer>
</body>
</html>
`
}

const check = process.argv.includes('--check')
let stale = 0
for (const item of PAGES) {
  for (const lang of LANGS) {
    const file = join(source, `${item.file}.${lang}.md`)
    if (!existsSync(file)) continue
    const relative = `${item.slug}/${lang === 'es' ? 'es/' : ''}index.html`
    const target = join(out, relative)
    // The docs link the base page of each document; Spanish pages point at the Spanish version.
    let body = markdownToHtml(readFileSync(file, 'utf8'))
    if (lang === 'es') for (const other of PAGES) body = body.replaceAll(`href="${pageUrl(other.slug, 'en')}"`, `href="${pageUrl(other.slug, 'es')}"`)
    // Draft markers must never reach a public page.
    const marker = body.match(/\[(PO approve|PO aprueba|REQUIRES|REQUIERE|VERIFY|VERIFICAR)[^\]]*\]|HIGH RISK|ALTO RIESGO|REVISAR|⚠️/)
    if (marker) { console.error(`draft marker in ${item.file}.${lang}.md: ${marker[0]}`); stale += 1; continue }
    const html = page(item, lang, body)
    if (check) {
      if (!existsSync(target) || readFileSync(target, 'utf8') !== html) { console.error(`stale: public/${relative}`); stale += 1 }
    } else {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, html)
      console.log(`wrote public/${relative}`)
    }
  }
}
if (stale) {
  console.error('Resolve draft markers in docs/governance/app-store/, then run: node scripts/build-legal-pages.mjs')
  process.exit(1)
}

