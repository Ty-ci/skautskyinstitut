'use client'

import { type ReactNode, useState } from 'react'

import PasswordForm from '@/components/dashboard/PasswordForm'
import { secondaryButton } from '@/components/dashboard/styles'
import TileIcon from '@/components/dashboard/TileIcon'

/** Read-only until the edit password is entered: a note, and a button opening the form in place */
const EditUnlock = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={secondaryButton}
      >
        <TileIcon name={isOpen ? 'x' : 'lock-keyhole'} className="size-4" />
        {isOpen ? 'Zavrieť' : 'Povoliť úpravy'}
      </button>
      {isOpen ? (
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_12px_18px_-6px_rgba(0,0,0,0.2)]">
          <p className="text-sm">{children}</p>
          <PasswordForm
            level="edit"
            submitLabel="Povoliť úpravy"
            className="mt-4"
            // Opened by the button just now, for typing the password
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
      ) : null}
    </div>
  )
}

export default EditUnlock
