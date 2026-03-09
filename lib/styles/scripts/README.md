# Style Generation Scripts

Generate CSS from TypeScript config. Run with `bun setup:styles`.

## Scripts

| Script | Output |
|--------|--------|
| `setup-styles.ts` | Orchestrates all generation |
| `generate-root.ts` | → `css/root.css` |
| `postcss-functions.mjs` | `mobile-vw()`, `columns()`, etc. |

## Build Flow

```
TypeScript Config → Generation Scripts → CSS Variables → PostCSS → Output
```

1. Edit `colors.ts`, `typography.ts`, etc.
2. Run `bun setup:styles`
3. Generated CSS is used by PostCSS

## Best Practices

- Always run `bun setup:styles` after config changes
- Never edit `css/root.css` directly
- Use `bun dev` for development (includes style watching)
