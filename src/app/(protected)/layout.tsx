import Link from 'next/link'
import { Home } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName = user.user_metadata?.display_name || 'Nutzer'

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-40 bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link
              href="/dashboard"
              className="shrink-0 text-primary hover:opacity-80 transition-opacity"
              aria-label="Startseite"
            >
              <Home className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline text-xl font-bold">Stundenplaner</span>
            </Link>
            <nav className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link
                href="/exercises"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Übungen
              </Link>
              <Link
                href="/groups"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Gruppen
              </Link>
              <Link
                href="/units"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Einheiten
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
