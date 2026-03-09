# Styles

CSS Modules with custom PostCSS functions and generated CSS variables.

## PostCSS Functions

```css
/* Viewport-relative sizing */
.element {
  width: mobile-vw(375);    /* 375px at mobile viewport */
  height: desktop-vh(100);  /* 100px at desktop viewport */
}

/* Grid columns */
.sidebar {
  width: columns(3);        /* Spans 3 columns + gaps */
}
```

## Breakpoints

```css
@media (--mobile) { /* <= 799px */ }
@media (--desktop) { /* >= 800px */ }
```

## Configuration

| File | Purpose |
|------|---------|
| `colors.ts` | Color palette & themes |
| `typography.ts` | Font sizes & weights |
| `layout.mjs` | Grid, breakpoints, spacing |
| `easings.ts` | Animation curves |
| `fonts.ts` | Font loading |

After changing config: `bun setup:styles`

## Generated Files (Don't Edit)

- `css/root.css` — CSS custom properties and media aliases

Run `bun setup:styles` to regenerate after config changes.
