"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Player } from "./types"
import { useAuth } from "@/hooks/use-auth"

function parseCsvToPlayers(csv: string): Player[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const getIdx = (name: string) => header.findIndex((h) => h === name.toLowerCase())

  const idxName = getIdx("player name")
  const idxRole = getIdx("role")
  const idxMobile = getIdx("mobile number")
  const idxImage = getIdx("image url")
  const idxCricheroes = getIdx("cricheroes id")

  const players: Player[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvRow(lines[i])
    const name = row[idxName] || ""
    if (!name) continue
    players.push({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: name.trim(),
      role: idxRole >= 0 ? (row[idxRole] || "").trim() : undefined,
      mobile: idxMobile >= 0 ? (row[idxMobile] || "").trim() : undefined,
      imageUrl: idxImage >= 0 ? (row[idxImage] || "").trim() : undefined,
      cricheroesId: idxCricheroes >= 0 ? (row[idxCricheroes] || "").trim() : undefined,
    })
  }
  return players
}

// Robust-ish CSV row splitter for quoted fields
function splitCsvRow(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map((s) => s.trim())
}

export default function PlayerImport({ onPlayersParsed }: { onPlayersParsed: (players: Player[]) => void }) {
  const [text, setText] = useState("")
  const fileRef = useRef<HTMLInputElement | null>(null)
  const { isAdmin } = useAuth()

  const handleParse = () => {
    const players = parseCsvToPlayers(text)
    onPlayersParsed(players)
    setText("")
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    const content = await file.text()
    const players = parseCsvToPlayers(content)
    onPlayersParsed(players)
    if (fileRef.current) fileRef.current.value = ""
  }

  const addSingle = () => {
    if (!text.trim()) return
    onPlayersParsed([{ id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), name: text.trim() }])
    setText("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="csv">Paste CSV from your sheet</Label>
        <Textarea
          id="csv"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Headers expected: Player Name, Role, Mobile Number, Image URL, Cricheroes Id"}
          disabled={!isAdmin}
        />
        <div className="flex gap-2">
          <Button onClick={handleParse} disabled={!isAdmin}>
            Import CSV
          </Button>
          <Button variant="secondary" type="button" onClick={addSingle} disabled={!isAdmin}>
            Quick add as single name
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Or upload CSV file</Label>
        <Input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
          disabled={!isAdmin}
        />
        {!isAdmin && <div className="text-xs text-muted-foreground">Login as admin to import players.</div>}
      </div>
    </div>
  )
}
