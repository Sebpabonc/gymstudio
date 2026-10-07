import React, { useState } from 'react'

/** Profile card whose content folds behind its title (PO 2026-10-07: every Profile section is collapsible). */
export default function CollapsibleCard({
  className,
  titleId,
  title,
  defaultOpen = false,
  children,
}: {
  className: string
  titleId: string
  title: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`${className} collapsible-card${open ? ' open' : ''}`} aria-labelledby={titleId}>
      <button
        type="button"
        className="collapsible-card-header"
        aria-expanded={open}
        aria-controls={`${titleId}-body`}
        onClick={() => setOpen((value) => !value)}
      >
        <h2 id={titleId}>{title}</h2>
        <span className="collapsible-card-icon" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id={`${titleId}-body`} className="collapsible-card-body" hidden={!open}>
        {children}
      </div>
    </section>
  )
}
