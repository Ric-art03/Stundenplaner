import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/logo'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            aria-label="Stundenplaner — zur Startseite"
          >
            <Logo variant="stacked" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
