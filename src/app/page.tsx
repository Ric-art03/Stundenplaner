import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
          <span className="text-xl font-bold text-primary">Stundenplaner</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrieren</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Sportstunden planen
            <br />
            <span className="text-primary">einfach und strukturiert</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Erstelle auf Knopfdruck abwechslungsreiche Trainingseinheiten für deine Gruppen.
            Passend zu Sportart, Alter, Halle und Material.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Kostenlos registrieren</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Stundenplaner — Für Übungsleiter und Trainer</p>
      </footer>
    </div>
  )
}
