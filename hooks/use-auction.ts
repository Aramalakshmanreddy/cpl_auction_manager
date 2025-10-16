"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  type AuctionState,
  type Player,
  type Team,
  type TeamPlayer,
  TEAM_BUDGET,
  TEAM_SIZE_LIMIT,
} from "@/components/types"

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

export function useAuction() {
  const [state, setState] = useState<AuctionState>(() => loadState())
  const { toast } = useToast()

  useEffect(() => {
    saveState(state)
  }, [state])

  const teamBudgetUsed = useCallback((team: Team) => team.players.reduce((a, p) => a + (Number(p.coins) || 0), 0), [])
  const teamBudgetLeft = useCallback((team: Team) => TEAM_BUDGET - teamBudgetUsed(team), [teamBudgetUsed])

  const assignedIds = useMemo(() => new Set(state.teams.flatMap((t) => t.players.map((p) => p.id))), [state.teams])
  const availablePlayers = useMemo(
    () => state.playersPool.filter((p) => !assignedIds.has(p.id)),
    [state.playersPool, assignedIds],
  )

  const upsertPlayers = (players: Player[]) => {
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

  const addPlayerToTeam = (player: Player, teamId: string, coins: number) => {
    const tIdx = state.teams.findIndex((t) => t.id === teamId)
    if (tIdx === -1) return
    const team = state.teams[tIdx]

    if (team.players.length >= TEAM_SIZE_LIMIT) {
      toast({
        title: "Team full",
        description: `Max ${TEAM_SIZE_LIMIT} players for ${team.name}. Please select another team or generate again.`,
        variant: "destructive",
      })
      return
    }
    const left = teamBudgetLeft(team)
    if (coins > left) {
      toast({
        title: "Insufficient budget",
        description: `${team.name} has only ${left} coins left.`,
        variant: "destructive",
      })
      return
    }

    const teamPlayer: TeamPlayer = { ...player, coins }
    setState((s) => {
      const teams = [...s.teams]
      teams[tIdx] = { ...team, players: [...team.players, teamPlayer] }
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
          return t
        }
        return { ...t, players: t.players.map((p) => (p.id === playerId ? { ...p, coins: newCoins } : p)) }
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
        if (t.id === fromTeamId) return { ...t, players: t.players.filter((p) => p.id !== playerId) }
        if (t.id === toTeamId) return { ...t, players: [...t.players, player] }
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
      completion: state.playersPool.length > 0 ? Math.round((assigned / state.playersPool.length) * 100) : 0,
    }
  }, [state.playersPool.length, state.teams])

  return {
    state,
    setState,
    availablePlayers,
    stats,
    teamBudgetUsed,
    teamBudgetLeft,
    upsertPlayers,
    clearAll,
    addPlayerToTeam,
    removePlayerFromTeam,
    editPlayerCoins,
    movePlayer,
    editTeamName,
    resetTeam,
  }
}
