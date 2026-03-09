'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useState } from 'react'
import Orchestra from '../orchestra'
import s from './cmdo.module.css'
import { OrchestraToggle } from '../toggle'

export function Cmdo() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'o' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }

      // Toggle grid
      if (e.key === 'G' && e.shiftKey) {
        e.preventDefault()
        Orchestra.setState((state) => ({
          grid: !state.grid,
        }))
      }

      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal keepMounted>
        <div id="orchestra">
          <Dialog.Backdrop {...(s.backdrop ? { className: s.backdrop } : {})} />
          <Dialog.Popup {...(s.popup ? { className: s.popup } : {})}>
            <div className={s.controls}>
              <OrchestraToggle id="grid">🌐</OrchestraToggle>
              <OrchestraToggle id="studio">⚙️</OrchestraToggle>
              <OrchestraToggle id="stats">📈</OrchestraToggle>
              <OrchestraToggle id="dev">🚧</OrchestraToggle>
              <OrchestraToggle id="minimap">🗺️</OrchestraToggle>
              <OrchestraToggle id="webgl" defaultValue={true}>
                🧊
              </OrchestraToggle>
              <OrchestraToggle id="screenshot">📸</OrchestraToggle>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
