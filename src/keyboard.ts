const FIELD_MARGIN = 16

// iOS scrolls the page further than needed when the keyboard opens, which hides the top of the screen.
// After the keyboard opens, this scrolls back to the smallest scroll that still shows the field.
export function limitKeyboardScroll() {
  const viewport = window.visualViewport
  if (!viewport) return

  viewport.addEventListener('resize', () => {
    const field = document.activeElement
    if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) return
    // A modal is fixed on the screen, so a page scroll does not move its fields.
    if (field.closest('.modal-backdrop')) return

    const fieldBottomInPage = field.getBoundingClientRect().bottom + window.scrollY
    const smallestScroll = Math.max(0, fieldBottomInPage + FIELD_MARGIN - viewport.height)
    if (window.scrollY <= smallestScroll) return
    window.scrollTo(0, smallestScroll)
  })
}
