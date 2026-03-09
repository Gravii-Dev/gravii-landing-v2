'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import {
  type AnchorHTMLAttributes,
  type ComponentProps,
  type MouseEvent,
  type MouseEventHandler,
  useEffect,
  useState,
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
  const [shouldPrefetch, setShouldPrefetch] = useState(false)
  const [isExternal, setIsExternal] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Get pathname - deferred to avoid blocking static generation
  // usePathname is safe to call but we defer the active check to useEffect
  const pathname = usePathname()

  useEffect(() => {
    // Check if this link is active (current page)
    if (href && pathname) {
      setIsActive(pathname === href)
    }
  }, [href, pathname])

  useEffect(() => {
    // Skip if no href
    if (!href) return

    // Check if external link
    try {
      const url = new URL(href, window.location.href)
      setIsExternal(url.host !== window.location.host)
    } catch {
      setIsExternal(false)
    }

    // Only prefetch on good connections
    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType: string; saveData: boolean }
      }
    ).connection
    if (connection) {
      const { effectiveType, saveData } = connection
      setShouldPrefetch(effectiveType === '4g' && !saveData)
    } else {
      // Default to prefetching if API not available
      setShouldPrefetch(true)
    }
  }, [href])

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

  // For SSR, check if it's external based on the href pattern
  const isExternalSSR =
    href.startsWith('http://') || href.startsWith('https://')

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

  if (isExternalSSR || isExternal) {
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
      prefetch={shouldPrefetch}
      data-active={isActive || undefined}
      {...(scroll !== undefined ? { scroll } : {})}
      {...(handleAnchorClick ? { onClick: handleAnchorClick } : {})}
      {...props}
    >
      {children}
    </NextLink>
  )
}
