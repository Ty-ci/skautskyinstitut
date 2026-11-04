'use client'

import { type SubmitEvent, useId, useState, useTransition } from 'react'

import { unlock } from '@/app/(frontend)/dashboard/actions'
import { fieldLabel, primaryButton, textInput } from '@/components/dashboard/styles'

interface Props {
  /** Which password: the one opening the dashboard, or the one allowing changes */
  level: 'view' | 'edit'
  submitLabel: string
  /** Focus the field at once – when the form is the thing the person came for */
  autoFocus?: boolean
  className?: string
}

/**
 * The password field and its button. A correct password sets a cookie, which re-renders the page
 * from the server – unlocked. A wrong one keeps what was typed, says so, and selects it for
 * another try.
 */
const PasswordForm = ({ level, submitLabel, autoFocus = false, className = '' }: Props) => {
  const inputId = useId()
  const errorId = useId()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('password') as HTMLInputElement
    setError('')

    startTransition(async () => {
      const granted = await unlock(level, password).catch(() => false)
      if (!granted) {
        setError('Nesprávne heslo, alebo sa ho teraz nepodarilo overiť. Skús to znova.')
        input.select()
      }
    })
  }

  return (
    <form className={className} onSubmit={submit}>
      <label htmlFor={inputId} className={fieldLabel}>
        Heslo
      </label>
      <input
        id={inputId}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error !== '' || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 ${textInput}`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-semibold text-[#a11b1b]">
          {error}
        </p>
      ) : null}

      <button type="submit" className={`mt-5 w-full ${primaryButton}`} disabled={isPending}>
        {isPending ? 'Overujem…' : submitLabel}
      </button>
    </form>
  )
}

export default PasswordForm
