"use client"

import { Button } from "@/components/ui/button"
import type { Team } from "./types"
import { useState } from "react"

export default function PdfExport({ teams }: { teams: Team[] }) {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF({ unit: "pt" })
      teams.forEach((team, idx) => {
        if (idx > 0) doc.addPage()
        doc.setFontSize(16)
        doc.text(`${team.name} - Players`, 40, 40)

        const rows = team.players.map((p, i) => [String(i + 1), p.name, p.mobile || "", p.role || "", String(p.coins)])

        if (rows.length > 0) {
          autoTable(doc, {
            startY: 60,
            head: [["#", "Player Name", "Mobile Number", "Role", "Coins"]],
            body: rows,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 0, 0] },
          })
          const finalY = (doc as any).lastAutoTable?.finalY ?? 60
          const total = team.players.reduce((a, p) => a + p.coins, 0)
          doc.text(`Total Coins: ${total}`, 40, finalY + 24)
        } else {
          doc.setFontSize(12)
          doc.text("No players assigned.", 40, 70)
        }
      })
      doc.save("cpl-auction-teams.pdf")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button onClick={download} disabled={downloading}>
      {downloading ? "Preparing PDF..." : "Download Teams PDF"}
    </Button>
  )
}
