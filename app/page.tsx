"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuction } from "@/hooks/use-auction"
import AuctionApp from "@/components/auction-app"

export default function Page() {
  const { stats } = useAuction()
  return (
    <main className="container mx-auto max-w-6xl p-6 md:p-10 space-y-8">
      {/* Hero */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-balance">CPL Auction Manager</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Manage your auction across dedicated pages: assign players, manage teams, and export results.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button asChild>
            <Link href="/assign">Assign</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/teams">Teams</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/downloads">Downloads</Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.assigned}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.remaining}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.completion}%</CardContent>
        </Card>
      </section>

      {/* CTA for small screens */}
      <section className="md:hidden flex flex-col gap-3">
        <Button asChild>
          <Link href="/assign">Go to Assign</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/teams">Go to Teams</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/downloads">Go to Downloads</Link>
        </Button>
      </section>

      <AuctionApp />
    </main>
  )
}
