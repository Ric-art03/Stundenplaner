import Link from 'next/link'
import { ClipboardList, Users, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.display_name || 'Nutzer'

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            Willkommen, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Was möchtest du heute vorbereiten?
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/exercises">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Übungsdatenbank</CardTitle>
                  <CardDescription>Übungen erstellen, verwalten und durchsuchen</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">Gruppenprofile</CardTitle>
                <CardDescription>Demnächst verfügbar</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">Einheiten-Generator</CardTitle>
                <CardDescription>Demnächst verfügbar</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  )
}
