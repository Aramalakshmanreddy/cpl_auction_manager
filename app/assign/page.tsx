"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import PlayerImport from "@/components/player-import"
import PlayerGenerator from "@/components/player-generator"
import { useAuction } from "@/hooks/use-auction"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"

export default function AssignPage() {
  const { state, upsertPlayers, addPlayerToTeam, availablePlayers } = useAuction()
  const { isAdmin } = useAuth()

  return (
    <main className="container mx-auto max-w-6xl py-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Assign Players</h1>
        <p className="text-muted-foreground">Import your list and assign players to teams with budgets enforced.</p>
      </section>

      {!isAdmin && (
        <Alert>
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            You’re viewing in read-only mode. Login as admin to import, generate, and assign players.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Import Players</CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <PlayerImport onPlayersParsed={upsertPlayers} />
            ) : (
              <p className="text-sm text-muted-foreground">Import Players is disabled in read-only mode.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generate & Assign</CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <PlayerGenerator availablePlayers={availablePlayers} teams={state.teams} onAdd={addPlayerToTeam} />
            ) : (
              <p className="text-sm text-muted-foreground">Generate & Assign is disabled in read-only mode.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Unassigned Players ({availablePlayers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-auto rounded border">
            <ul className="divide-y">
              {availablePlayers.map((p, idx) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{p.role || ""}</span>
                </li>
              ))}
              {availablePlayers.length === 0 && (
                <li className="px-3 py-4 text-sm text-muted-foreground">No remaining players.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
