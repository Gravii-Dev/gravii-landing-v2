# Style Guide

This project uses **CSS Modules as the primary styling system**.

## Core Rules

- Use `*.module.css` for component/page styles.
- Keep one style pair per component when possible:
  - `Component.tsx`
  - `component.module.css`
- Use semantic class names in `camelCase` (`root`, `title`, `ctaButton`).
- Use state prefixes for boolean/UI states: `is*`, `has*`.
- Use variant/size prefixes for style variants: `variant*`, `size*`.

## Scope and Selectors

- Style via classes only.
- Avoid raw tag selectors (`div`, `h1`) inside modules unless strictly local and intentional.
- Avoid `:global`; allow only for third-party integration overrides.
- Avoid `!important`; if unavoidable, add a short comment explaining why.

## Tokens and Theming

- Do not hardcode design values when a token exists.
- Use CSS custom properties from generated style layers:
  - colors: `var(--color-*)`
  - spacing/layout: `var(--gap)`, `var(--safe)`, etc.
  - easings: `var(--ease-*)`
- Theme switching must rely on `[data-theme=*]` variable overrides, not per-component hardcoded palettes.

## Tailwind Usage Policy

- Do not add new Tailwind utility classes in app/components code.
- Existing Tailwind code should be migrated to CSS Modules incrementally.
- Utility classes may remain temporarily in untouched legacy files during migration.

## Responsive and Motion

- Prefer custom media aliases from generated root styles:
  - `@media (--mobile)`
  - `@media (--desktop)`
  - `@media (--reduced-motion)`
- Respect reduced motion preferences for non-essential animation.

## Class Composition in TSX

- Keep `className` composition explicit and readable.
- Prefer:
  - `className={s.root}`
  - `className={`${s.root} ${isActive ? s.isActive : ''}`.trim()}`
- Use `clsx` only when composition becomes complex.

