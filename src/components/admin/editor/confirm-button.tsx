'use client'

import { Button } from '@/components/ui/button'

/** Botão de submit que pede confirmação antes de ações destrutivas. */
export function ConfirmButton({ message, children, ...props }: { message: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
    >
      {children}
    </Button>
  )
}
