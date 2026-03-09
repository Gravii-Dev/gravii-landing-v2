# Gravii-Lp-2 - Deployment Checklist

Generated: 2026-03-08

## Pre-Deployment

- [ ] All environment variables configured in hosting platform
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Build passes without errors (`bun run build`)
- [ ] TypeScript passes without errors (`bun typecheck`)

## Performance

- [ ] Lighthouse score > 90 for Performance
- [ ] Lighthouse score > 90 for Accessibility
- [ ] Images optimized and using next/image
- [ ] No console errors in production

## SEO

- [ ] Meta titles and descriptions set for all pages
- [ ] Open Graph images configured
- [ ] robots.txt configured correctly
- [ ] sitemap.xml generating correctly
- [ ] Canonical URLs set

## Analytics

- [ ] Google Analytics or Tag Manager configured
- [ ] Cookie consent implemented (if required)
- [ ] Privacy policy page exists

## Post-Deployment

- [ ] Verify all pages load correctly
- [ ] Test all forms and interactions
- [ ] Verify analytics receiving data
- [ ] Test on mobile devices
- [ ] Test in different browsers
