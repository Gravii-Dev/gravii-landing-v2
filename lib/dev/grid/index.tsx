import cn from 'clsx'
import { useWindowSize } from 'hamo'
import { useMemo } from 'react'
import s from './grid.module.css'

type GridDebuggerProps = {
  gridClassName?: string
}

export function GridDebugger({
  gridClassName,
}: GridDebuggerProps) {
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  // biome-ignore lint/correctness/useExhaustiveDependencies: columns dependency is needed to adjust on size changes
  const columns = useMemo(
    () =>
      Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--columns'
        ),
        10
      ),
    [windowWidth, windowHeight]
  )

  return (
    <div className={s.overlay}>
      <div className={cn(s.grid, gridClassName, s.debugger)}>
        {Array.from({ length: columns }).map((_, index) => (
          <span
            key={`column-${
              // biome-ignore lint/suspicious/noArrayIndexKey: grid columns are static
              index
            }`}
          />
        ))}
      </div>
    </div>
  )
}
