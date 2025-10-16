import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import NavbarAuth from "@/components/navbar-auth"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <header className="border-b bg-background">
          <div className="container mx-auto max-w-7xl flex items-center justify-between p-4">
            <Link href="/" className="font-semibold">
              CPL Auction
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/assign">Assign</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/teams">Teams</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/downloads">Downloads</Link>
              </Button>
              <NavbarAuth />
            </nav>
          </div>
        </header>
        <Suspense fallback={null}>
          {children}
          <Toaster />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
