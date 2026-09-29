'use client'

import { useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      await logout()
      window.location.href = '/'
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Wird abgemeldet...' : 'Abmelden'}
    </Button>
  )
}
