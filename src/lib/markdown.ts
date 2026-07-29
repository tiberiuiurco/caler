import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

// Task-list checkboxes are rendered enabled (not `disabled`, marked's default) and tagged with
// their position among all checkboxes in the document, so a click on the rendered HTML can be
// mapped back to the matching `- [ ]`/`- [x]` marker in the raw markdown source. The counter is
// reset at the start of every `renderMarkdown` call, and rendering is otherwise synchronous and
// single-threaded, so it always lines up with the order `toggleMarkdownCheckbox` scans in.
let renderCheckboxIndex = 0

marked.use({
  renderer: {
    checkbox({ checked }) {
      const index = renderCheckboxIndex++
      return `<input type="checkbox" data-task-index="${index}" ${checked ? 'checked ' : ''}/> `
    },
    // Tags completed task-list items with a class so they can be shown struck-through.
    listitem(item) {
      const content = this.parser.parse(item.tokens)
      if (!item.task) return `<li>${content}</li>\n`
      return `<li class="task-item${item.checked ? ' task-item-done' : ''}">${content}</li>\n`
    },
  },
})

/** Renders a markdown string to HTML for display (goals are always the user's own local data). */
export function renderMarkdown(source: string): string {
  renderCheckboxIndex = 0
  return marked.parse(source, { async: false })
}

/** Matches a task-list item's leading marker + checkbox, e.g. "- [ ] " or "12. [x] ", at the start of a line. */
const TASK_CHECKBOX_PATTERN = /^(\s*(?:[-*+]|\d+[.)])\s+)\[([ xX])\]/gm

/**
 * Flips the `index`-th task-list checkbox (0-based, in document order) in raw markdown `source`
 * between checked/unchecked, matching the indices `renderMarkdown` tags its rendered checkboxes with.
 */
export function toggleMarkdownCheckbox(source: string, index: number): string {
  let seen = -1
  return source.replace(TASK_CHECKBOX_PATTERN, (match, marker: string, mark: string) => {
    seen += 1
    if (seen !== index) return match
    return `${marker}[${mark === ' ' ? 'x' : ' '}]`
  })
}
