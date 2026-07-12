/**
 * Radix Dialog/DropdownMenu/AlertDialog each lock background interaction by setting
 * `pointer-events: none` on <body> while open, and restore it on close. When a Dialog
 * is triggered from inside a DropdownMenuItem, both primitives race to set/restore that
 * same style, and the restore can be lost — leaving the whole app permanently unclickable
 * even though no dialog/menu is visibly open (https://github.com/radix-ui/primitives/issues/1241).
 *
 * This watches <body>'s style attribute and force-clears a stuck `pointer-events: none`
 * whenever no Radix dialog/menu/alertdialog is actually present in the DOM.
 */
export function installRadixBodyLockFix(): () => void {
  const clearIfStuck = () => {
    if (document.body.style.pointerEvents !== "none") return
    const hasOpenOverlay = document.querySelector(
      '[role="dialog"], [role="menu"], [role="alertdialog"], [role="listbox"]',
    )
    if (!hasOpenOverlay) {
      document.body.style.removeProperty("pointer-events")
    }
  }

  const observer = new MutationObserver(clearIfStuck)
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })

  return () => observer.disconnect()
}
