import { type HTMLAttributes, type RefObject, useEffect, useState } from 'react'
import Orchestra from '../orchestra'
import s from './toggle.module.css'

type OrchestraToggleProps = Omit<
  HTMLAttributes<HTMLButtonElement>,
  'id' | 'children' | 'defaultValue'
> & {
  children: string
  id: string
  buttonRef?: RefObject<HTMLButtonElement | null>
  defaultValue?: boolean
}

export function OrchestraToggle({
  id,
  children,
  buttonRef,
  defaultValue,
  className,
  ...props
}: OrchestraToggleProps) {
  useEffect(() => {
    Orchestra.setState((state) => ({ [id]: defaultValue ?? state[id] }))
  }, [defaultValue, id])

  const [active, setActive] = useState(defaultValue ?? Orchestra.getState()[id])

  useEffect(() => {
    const unsubscribe = Orchestra.subscribe(
      ({ [id]: value }) => value,
      (value) => {
        setActive(value)
      },
      {
        fireImmediately: true,
      }
    )
    return unsubscribe
  }, [id])

  return (
    <button
      type="button"
      {...props}
      onClick={() => {
        Orchestra.setState((state) => ({ [id]: !state[id] }))
      }}
      style={{
        backgroundColor: active ? 'rgba(0, 255, 0, 0.5)' : '',
      }}
      className={s.button}
      title={id}
    >
      {children}
    </button>
  )
}
