"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { type Team, type TeamPlayer, TEAM_BUDGET, TEAM_SIZE_LIMIT } from "./types"
import { useAuth } from "@/hooks/use-auth"

export default function TeamBox({
  team,
  teams,
  budgetUsed,
  budgetLeft,
  onEditTeamName,
  onResetTeam,
  onRemovePlayer,
  onEditPlayerCoins,
  onMovePlayer,
}: {
  team: Team
  teams: Team[]
  budgetUsed: number
  budgetLeft: number
  onEditTeamName: (newName: string) => void
  onResetTeam: () => void
  onRemovePlayer: (playerId: string) => void
  onEditPlayerCoins: (playerId: string, coins: number) => void
  onMovePlayer: (playerId: string, toTeamId: string) => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(team.name)
  const { isAdmin } = useAuth()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        {editingName ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onEditTeamName(name.trim())
                  setEditingName(false)
                }
              }}
              disabled={!isAdmin}
            />
            <Button
              size="sm"
              onClick={() => {
                onEditTeamName(name.trim())
                setEditingName(false)
              }}
              disabled={!isAdmin}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setName(team.name)
                setEditingName(false)
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <CardTitle className="text-lg">{team.name}</CardTitle>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditingName((v) => !v)} disabled={!isAdmin}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onResetTeam} disabled={!isAdmin}>
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <BadgeLike label="Players" value={`${team.players.length}/${TEAM_SIZE_LIMIT}`} />
          <BadgeLike label="Used" value={budgetUsed} />
          <BadgeLike label="Left" value={budgetLeft} />
          <div className="w-full h-2 bg-muted rounded-md overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, Math.round((budgetUsed / TEAM_BUDGET) * 100))}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {team.players.length === 0 ? (
            <div className="text-sm text-muted-foreground">No players yet.</div>
          ) : (
            team.players.map((p) => (
              <TeamPlayerRow
                key={p.id}
                player={p}
                teams={teams}
                currentTeamId={team.id}
                onRemove={() => onRemovePlayer(p.id)}
                onEditCoins={(coins) => onEditPlayerCoins(p.id, coins)}
                onMove={(toId) => onMovePlayer(p.id, toId)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BadgeLike({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function TeamPlayerRow({
  player,
  teams,
  currentTeamId,
  onRemove,
  onEditCoins,
  onMove,
}: {
  player: TeamPlayer
  teams: Team[]
  currentTeamId: string
  onRemove: () => void
  onEditCoins: (coins: number) => void
  onMove: (toTeamId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [coins, setCoins] = useState<number>(player.coins)
  const { isAdmin } = useAuth()

  const saveCoins = () => {
    if (coins > 0) onEditCoins(coins)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2">
      <div className="min-w-0">
        <div className="font-medium truncate">{player.name}</div>
        <div className="text-xs text-muted-foreground truncate">{player.role || "—"}</div>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={`coins-${player.id}`} className="sr-only">
              Coins
            </Label>
            <Input
              id={`coins-${player.id}`}
              type="number"
              min={1}
              step={1}
              value={coins || ""}
              onChange={(e) => setCoins(Number(e.target.value) || 0)}
              className="w-24"
              disabled={!isAdmin}
            />
            <Button size="sm" onClick={saveCoins} disabled={!isAdmin}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCoins(player.coins)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="text-sm tabular-nums">{player.coins}</div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={!isAdmin}>
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Player Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setEditing(true)} disabled={!isAdmin}>
              Edit Coins
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove} disabled={!isAdmin}>
              Delete
            </DropdownMenuItem>
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {teams
              .filter((t) => t.id !== currentTeamId)
              .map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => onMove(t.id)} disabled={!isAdmin}>
                  {t.name}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
