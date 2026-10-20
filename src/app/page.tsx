import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo, LogoMarkModeled } from '@/components/logo'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex gap-2">
            {/* Am Handy passt neben das Logo nur ein Knopf; „Anmelden" steht dort weiter unten auf der Seite. */}
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrieren</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 lg:py-16">
        <div className="w-full max-w-6xl flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-16">
          <div className="max-w-2xl text-center space-y-8 lg:max-w-xl lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight lg:leading-tight">
              Sportstunden planen
              <br />
              <span className="text-primary">einfach und strukturiert</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Erstelle auf Knopfdruck abwechslungsreiche Trainingseinheiten für deine Gruppen.
              Passend zu Sportart, Alter, Halle und Material.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/register">Kostenlos registrieren</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Anmelden</Link>
              </Button>
            </div>
          </div>
          {/* Am Handy über der Überschrift, ab 1024 px groß daneben. */}
          <div className="order-first lg:order-none flex shrink-0 items-center justify-center rounded-full bg-green-50 h-44 w-44 sm:h-56 sm:w-56 lg:h-[440px] lg:w-[440px]">
            <LogoMarkModeled className="h-32 w-32 sm:h-40 sm:w-40 lg:h-[340px] lg:w-[340px]" />
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Stundenplaner — Für Übungsleiter und Trainer</p>
      </footer>
    </div>
  )
}
