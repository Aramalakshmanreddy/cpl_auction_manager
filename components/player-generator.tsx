"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { Player, Team } from "./types"
import { TEAM_SIZE_LIMIT, TEAM_BUDGET } from "./types"
import { useAuth } from "@/hooks/use-auth"

export default function PlayerGenerator({
  availablePlayers,
  teams,
  onAdd,
}: {
  availablePlayers: Player[]
  teams: Team[]
  onAdd: (player: Player, teamId: string, coins: number) => void
}) {
  const [current, setCurrent] = useState<Player | null>(null)
  const [teamId, setTeamId] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const { isAdmin } = useAuth()
const [showImage, setShowImage] = useState(false)
  const selectedTeam = useMemo(() => teams.find((t) => t.id === teamId) || null, [teams, teamId])
  const teamIsFull = !!selectedTeam && selectedTeam.players.length >= TEAM_SIZE_LIMIT

  const teamCoinsSpent = useMemo(
    () => (selectedTeam ? selectedTeam.players.reduce((sum, p) => sum + (p.coins || 0), 0) : 0),
    [selectedTeam],
  )
  const teamCoinsRemaining = useMemo(() => Math.max(0, TEAM_BUDGET - teamCoinsSpent), [teamCoinsSpent])
  const teamBudgetReached = teamCoinsRemaining <= 0
  const wouldExceedBudget = coins > 0 && coins > teamCoinsRemaining

  const canAssign = useMemo(
    () => Boolean(current && teamId && coins > 0 && !teamIsFull && !teamBudgetReached && !wouldExceedBudget),
    [current, teamId, coins, teamIsFull, teamBudgetReached, wouldExceedBudget],
  )

  const generate = () => {
    if (availablePlayers.length === 0) {
      setCurrent(null)
      return
    }
    const idx = Math.floor(Math.random() * availablePlayers.length)
    setCurrent(availablePlayers[idx])
    setTeamId("")
    setCoins(0)
  }

  const assign = () => {
    if (!current || !teamId || coins <= 0) return
    onAdd(current, teamId, coins)
    setCurrent(null)
    setTeamId("")
    setCoins(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={generate} disabled={!isAdmin}>
          Generate Player
        </Button>
        <span className="text-sm text-muted-foreground">Available: {availablePlayers.length}</span>
        {!isAdmin && <span className="text-xs text-muted-foreground">Read-only mode</span>}
      </div>

      {current ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Player</div>
                <div className="font-medium">{current.name}</div>
                {current.role ? <div className="text-sm text-muted-foreground">{current.role}</div> : null}
                {current.mobile ? <div className="text-sm text-muted-foreground">Mobile: {current.mobile}</div> : null}
                {/* {current.imageUrl ? <div className="text-sm text-muted-foreground">Image Url: {current.imageUrl}</div> : null} */}
              
              {/* {current.imageUrl ? (
  <div className="flex items-center gap-2">Image Url:
    <Button variant="secondary" size="sm" asChild>
      <a href={current.imageUrl} target="_blank" rel="noopener noreferrer">
        View Image
      </a>
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const link = document.createElement("a")
        link.href = current.imageUrl!
        link.download = `${current.name || "player"}.jpg`
        link.click()
      }}
    >
      Download
    </Button>
  </div>
) : null} */}
{current.imageUrl ? (
  <div className="flex flex-col gap-2">Image Url:
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowImage((prev) => !prev)}
      >
        {showImage ? "Hide Image" : "View Image"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!current.imageUrl) return
          const link = document.createElement("a")
          link.href = current.imageUrl
          link.download = `${current.name || "player"}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }}
      >
        Download
      </Button>
    </div>

    {showImage && (
      <div className="mt-2">
        <img
          src={current.imageUrl}
          alt={current.name || "Player image"}
          className="w-48 h-48 rounded-md border object-cover"
        />
      </div>
    )}
  </div>
) : null}
              
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Team</Label>
                  <Select value={teamId} onValueChange={(v) => setTeamId(v)}>
                    <SelectTrigger className="w-full" disabled={!isAdmin}>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Coins</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={coins || ""}
                    onChange={(e) => setCoins(Number(e.target.value) || 0)}
                    disabled={!isAdmin}
                  />
                </div>

                {selectedTeam ? (
                  <div className="text-xs text-muted-foreground">
                    Remaining coins for {selectedTeam.name}: {teamCoinsRemaining} / {TEAM_BUDGET}
                  </div>
                ) : null}

                {teamIsFull ? (
                  <div className="text-sm text-destructive" aria-live="polite">
                    {selectedTeam?.name} is already full ({TEAM_SIZE_LIMIT} players). Please choose another team or
                    click Generate to continue.
                  </div>
                ) : teamBudgetReached ? (
                  <div className="text-sm text-destructive" aria-live="polite">
                    {selectedTeam?.name} has completed its {TEAM_BUDGET} coins. You cannot assign more players to this
                    team.
                  </div>
                ) : wouldExceedBudget ? (
                  <div className="text-sm text-destructive" aria-live="polite">
                    {selectedTeam?.name} has only {teamCoinsRemaining} coins remaining. Reduce the coins or choose
                    another team.
                  </div>
                ) : null}

                <div>
                  <Button disabled={!canAssign || !isAdmin} onClick={assign}>
                    Add to Team
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-sm text-muted-foreground">Click Generate to draw a random unassigned player.</div>
      )}
    </div>
  )
}
