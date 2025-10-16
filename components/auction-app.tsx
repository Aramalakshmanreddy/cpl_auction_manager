"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { type AuctionState, type Player, type Team, type TeamPlayer, TEAM_BUDGET, TEAM_SIZE_LIMIT } from "./types"
import PlayerImport from "./player-import"
import PlayerGenerator from "./player-generator"
import TeamBox from "./team-box"
import PdfExport from "./pdf-export"
import RemainingExport from "./remaining-export"

const STORAGE_KEY = "cpl-auction-state-v1"

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

const defaultTeams: Team[] = [
  { id: createId(), name: "Team A", players: [] },
  { id: createId(), name: "Team B", players: [] },
  { id: createId(), name: "Team C", players: [] },
  { id: createId(), name: "Team D", players: [] },
]

function loadState(): AuctionState {
  if (typeof window === "undefined") return { playersPool: [], teams: defaultTeams }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { playersPool: [], teams: defaultTeams }
    const parsed: AuctionState = JSON.parse(raw)
    // Backfill if teams got deleted accidentally
    if (!parsed.teams || parsed.teams.length !== 4) {
      const existing = parsed.teams?.slice(0, 4) ?? []
      const needed = 4 - existing.length
      const fill = Array.from({ length: Math.max(0, needed) }).map((_, i) => ({
        id: createId(),
        name: `Team ${String.fromCharCode(65 + existing.length + i)}`,
        players: [],
      }))
      parsed.teams = [...existing, ...fill].slice(0, 4)
    }
    return parsed
  } catch {
    return { playersPool: [], teams: defaultTeams }
  }
}

function saveState(state: AuctionState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function AuctionApp() {
  const [state, setState] = useState<AuctionState>(() => loadState())
  const { toast } = useToast()

  useEffect(() => {
    saveState(state)
  }, [state])

  const assignedIds = useMemo(() => new Set(state.teams.flatMap((t) => t.players.map((p) => p.id))), [state.teams])
  const availablePlayers = useMemo(
    () => state.playersPool.filter((p) => !assignedIds.has(p.id)),
    [state.playersPool, assignedIds],
  )

  const upsertPlayers = (players: Player[]) => {
    // Avoid duplicates by name + cricheroesId combo where available
    const byKey = new Map<string, Player>()
    const keyOf = (p: Player) => `${(p.name || "").trim().toLowerCase()}|${(p.cricheroesId || "").trim()}`
    for (const p of state.playersPool) byKey.set(keyOf(p), p)
    for (const p of players) {
      const key = keyOf(p)
      if (!byKey.has(key)) byKey.set(key, { ...p, id: p.id || createId() })
    }
    setState((s) => ({ ...s, playersPool: Array.from(byKey.values()) }))
    toast({ title: "Players imported", description: `${players.length} processed.` })
  }

  const clearAll = () => {
    if (!confirm("This will reset all teams and players assignments. Continue?")) return
    setState({ playersPool: [], teams: defaultTeams.map((t) => ({ ...t, id: createId(), players: [] })) })
  }

  const teamBudgetUsed = (team: Team) => team.players.reduce((acc, p) => acc + (Number(p.coins) || 0), 0)
  const teamBudgetLeft = (team: Team) => TEAM_BUDGET - teamBudgetUsed(team)

  const addPlayerToTeam = (player: Player, teamId: string, coins: number) => {
    const tidx = state.teams.findIndex((t) => t.id === teamId)
    if (tidx === -1) return
    const team = state.teams[tidx]

    if (team.players.length >= TEAM_SIZE_LIMIT) {
      toast({ title: "Team full", description: `Max ${TEAM_SIZE_LIMIT} players per team.`, variant: "destructive" })
      return
    }
    const left = teamBudgetLeft(team)
    if (coins > left) {
      toast({
        title: "Insufficient budget",
        description: `Only ${left} coins left for ${team.name}.`,
        variant: "destructive",
      })
      return
    }

    const teamPlayer: TeamPlayer = { ...player, coins }
    setState((s) => {
      const teams = [...s.teams]
      teams[tidx] = { ...team, players: [...team.players, teamPlayer] }
      return { ...s, teams }
    })
    toast({ title: "Player added", description: `${player.name} → ${team.name} for ${coins} coins` })
  }

  const removePlayerFromTeam = (teamId: string, playerId: string) => {
    setState((s) => {
      const teams = s.teams.map((t) =>
        t.id === teamId ? { ...t, players: t.players.filter((p) => p.id !== playerId) } : t,
      )
      return { ...s, teams }
    })
  }

  const editPlayerCoins = (teamId: string, playerId: string, newCoins: number) => {
    setState((s) => {
      const teams = s.teams.map((t) => {
        if (t.id !== teamId) return t
        const current = t.players.find((p) => p.id === playerId)
        if (!current) return t
        const otherSum = t.players.filter((p) => p.id !== playerId).reduce((a, p) => a + p.coins, 0)
        if (otherSum + newCoins > TEAM_BUDGET) {
          // reject change
          return t
        }
        return {
          ...t,
          players: t.players.map((p) => (p.id === playerId ? { ...p, coins: newCoins } : p)),
        }
      })
      return { ...s, teams }
    })
  }

  const movePlayer = (fromTeamId: string, toTeamId: string, playerId: string) => {
    if (fromTeamId === toTeamId) return
    const fromTeam = state.teams.find((t) => t.id === fromTeamId)
    const toTeam = state.teams.find((t) => t.id === toTeamId)
    if (!fromTeam || !toTeam) return
    const player = fromTeam.players.find((p) => p.id === playerId)
    if (!player) return
    if (toTeam.players.length >= TEAM_SIZE_LIMIT) {
      toast({
        title: "Destination full",
        description: `${toTeam.name} already has ${TEAM_SIZE_LIMIT} players.`,
        variant: "destructive",
      })
      return
    }
    const left = teamBudgetLeft(toTeam)
    if (player.coins > left) {
      toast({
        title: "Insufficient budget",
        description: `${toTeam.name} has only ${left} coins left.`,
        variant: "destructive",
      })
      return
    }
    setState((s) => {
      const teams = s.teams.map((t) => {
        if (t.id === fromTeamId) {
          return { ...t, players: t.players.filter((p) => p.id !== playerId) }
        } else if (t.id === toTeamId) {
          return { ...t, players: [...t.players, player] }
        }
        return t
      })
      return { ...s, teams }
    })
    toast({ title: "Player moved", description: `${player.name} → ${toTeam.name}` })
  }

  const editTeamName = (teamId: string, newName: string) => {
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === teamId ? { ...t, name: newName || t.name } : t)),
    }))
  }

  const resetTeam = (teamId: string) => {
    if (!confirm("Reset this team? All its players will return to the pool.")) return
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === teamId ? { ...t, players: [] } : t)),
    }))
  }

  const stats = useMemo(() => {
    const assigned = state.teams.reduce((a, t) => a + t.players.length, 0)
    return {
      total: state.playersPool.length,
      assigned,
      remaining: state.playersPool.length - assigned,
    }
  }, [state.playersPool.length, state.teams])

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Auction Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Stat label="Total Players" value={stats.total} />
            <Stat label="Assigned" value={stats.assigned} />
            <Stat label="Remaining" value={stats.remaining} />
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">
                {stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PdfExport teams={state.teams} />
            <RemainingExport players={availablePlayers} />
            <Button variant="secondary" onClick={clearAll}>
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import + Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-balance">Import Players</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerImport onPlayersParsed={upsertPlayers} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-balance">Generate & Assign Player</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerGenerator availablePlayers={availablePlayers} teams={state.teams} onAdd={addPlayerToTeam} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Teams */}
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
          />
        ))}
      </div>

      {/* Unassigned Players */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Unassigned Players ({availablePlayers.length})</CardTitle>
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
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
