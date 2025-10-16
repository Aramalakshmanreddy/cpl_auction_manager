"use client"

import { Button } from "@/components/ui/button"
import type { Player } from "./types"
import { useState } from "react"

export default function RemainingExport({ players }: { players: Player[] }) {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF({ unit: "pt" })
      doc.setFontSize(16)
      doc.text("Remaining (Unassigned) Players", 40, 40)

      const rows = players.map((p, i) => [
        String(i + 1),
        p.name || "",
        p.role || "",
        p.mobile || "",
        p.imageUrl || "",
        p.cricheroesId || "",
      ])

      if (rows.length > 0) {
        autoTable(doc, {
          startY: 60,
          head: [["#", "Player Name", "Role", "Mobile Number", "Image URL", "Cricheroes Id"]],
          body: rows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [0, 0, 0] },
          columnStyles: {
            4: { cellWidth: 160 }, // Image URL wider
          },
        })
      } else {
        doc.setFontSize(12)
        doc.text("No remaining players. All assigned.", 40, 70)
      }

      doc.save("cpl-auction-remaining.pdf")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant="outline" onClick={download} disabled={downloading}>
      {downloading ? "Preparing PDF..." : "Download Remaining PDF"}
    </Button>
  )
}
