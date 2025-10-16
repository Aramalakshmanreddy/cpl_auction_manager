"use client"

import PdfExport from "@/components/pdf-export"
import RemainingExport from "@/components/remaining-export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuction } from "@/hooks/use-auction"
import { useAuth } from "@/hooks/use-auth"

export default function DownloadsPage() {
  const { state, availablePlayers, clearAll, stats } = useAuction()
  const { isAdmin } = useAuth()

  return (
    <main className="container mx-auto max-w-5xl py-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Downloads</h1>
        <p className="text-muted-foreground">Export finalized team sheets and the remaining (unassigned) players.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Sheets PDF</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Assigned: {stats.assigned} players across {state.teams.length} teams.
            </div>
            <PdfExport teams={state.teams} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining Players PDF</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Remaining: {availablePlayers.length} players not yet assigned.
            </div>
            <RemainingExport players={availablePlayers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Reset everything and start fresh. This cannot be undone.</p>
          <Button variant="destructive" onClick={clearAll} disabled={!isAdmin}>
            Reset All
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
