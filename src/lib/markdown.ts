import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/** Renders a markdown string to sanitized-by-convention HTML for display (goals are always the user's own local data). */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false })
}
