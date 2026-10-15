export function focusInvalid(name?: string) {
  requestAnimationFrame(() => {
    const field =
      (name ? document.querySelector(`[data-field="${name}"]`) : null) ??
      document.querySelector('[aria-invalid="true"]')
    const control = field?.matches('input')
      ? field
      : field?.querySelector<HTMLElement>('input, select, button')
    ;(control as HTMLElement | null)?.focus()
    field?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  })
}
