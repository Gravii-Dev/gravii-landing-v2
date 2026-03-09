'use client'

import NextLink from 'next/link'
import type {
  AnchorHTMLAttributes,
  ComponentProps,
  MouseEvent,
  MouseEventHandler,
} from 'react'

// Helper to extract props safe for button elements
function getButtonProps(props: Record<string, unknown>) {
  const {
    href,
    target,
    rel,
    'data-external': _dataExternal,
    ...buttonProps
  } = props
  return buttonProps
}

// Helper to extract props safe for div elements
function getDivProps(props: Record<string, unknown>) {
  const {
    href,
    target,
    rel,
    onClick,
    'data-external': _dataExternal,
    ...divProps
  } = props
  return divProps
}

// import { usePageTransitionNavigate } from '../page-transition/context'

type CustomLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ComponentProps<typeof NextLink> | 'href' | 'onClick'
> &
  Omit<ComponentProps<typeof NextLink>, 'href' | 'onClick'> & {
    href?: string
    onClick?: ((e: MouseEvent<HTMLElement>) => void) | undefined
    scroll?: boolean | undefined
  }

export function Link({
  href,
  children,
  onClick,
  scroll,
  ...props
}: CustomLinkProps) {
  // If no href is provided but there's an onClick, render a button
  if (!href && onClick) {
    return (
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => onClick(e)}
        type="button"
        {...getButtonProps(props)}
      >
        {children}
      </button>
    )
  }

  // If no href and no onClick, render a div
  if (!href) {
    return <div {...getDivProps(props)}>{children}</div>
  }

  const handleAnchorClick: MouseEventHandler<HTMLAnchorElement> | undefined =
    onClick
      ? (event) => {
          onClick(event)
        }
      : undefined

  const isHashLink = href.startsWith('#')

  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')

  if (isHashLink) {
    return (
      <NextLink
        href={href as ComponentProps<typeof NextLink>['href']}
        prefetch={false}
        scroll={scroll ?? true}
        {...(handleAnchorClick ? { onClick: handleAnchorClick } : {})}
        {...props}
      >
        {children}
      </NextLink>
    )
  }

  if (isExternal) {
    return (
      <NextLink
        href={href as ComponentProps<typeof NextLink>['href']}
        prefetch={false}
        target="_blank"
        rel="noopener noreferrer"
        data-external
        {...(handleAnchorClick ? { onClick: handleAnchorClick } : {})}
        {...props}
      >
        {children}
      </NextLink>
    )
  }

  return (
    <NextLink
      href={href as ComponentProps<typeof NextLink>['href']}
      {...(scroll !== undefined ? { scroll } : {})}
      {...(handleAnchorClick ? { onClick: handleAnchorClick } : {})}
      {...props}
    >
      {children}
    </NextLink>
  )
}
