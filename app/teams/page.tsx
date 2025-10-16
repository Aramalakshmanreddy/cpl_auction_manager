"use client"

import TeamBox from "@/components/team-box"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuction } from "@/hooks/use-auction"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"

export default function TeamsPage() {
  const {
    state,
    teamBudgetLeft,
    teamBudgetUsed,
    editTeamName,
    resetTeam,
    removePlayerFromTeam,
    editPlayerCoins,
    movePlayer,
  } = useAuction()
  const { isAdmin } = useAuth()

  return (
    <main className="container mx-auto max-w-7xl py-8 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <p className="text-muted-foreground">Manage rosters, budgets, and player moves.</p>
      </section>

      {!isAdmin && (
        <Alert>
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            Login as admin to edit coins, move or delete players, and rename/reset teams.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.teams.map((team) => (
          <TeamBox
            key={team.id}
            team={team}
            teams={state.teams}
            budgetUsed={teamBudgetUsed(team)}
            budgetLeft={teamBudgetLeft(team)}
            onEditTeamName={(name) => editTeamName(team.id, name)}
            onResetTeam={() => resetTeam(team.id)}
            onRemovePlayer={(pid) => removePlayerFromTeam(team.id, pid)}
            onEditPlayerCoins={(pid, coins) => editPlayerCoins(team.id, pid, coins)}
            onMovePlayer={(pid, toId) => movePlayer(team.id, toId, pid)}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {state.teams.map((team) => (
            <div key={team.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{team.name}</span>
                <span className="text-sm">{team.players.length} / 16</span>
              </div>
              <div className="mt-2 text-sm">
                <div>Used: {teamBudgetUsed(team)}</div>
                <div>Left: {teamBudgetLeft(team)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
