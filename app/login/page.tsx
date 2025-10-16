"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(username.trim(), password)
    setLoading(false)
    if (res.ok) {
      toast({ title: "Logged in", description: "Welcome back!" })
      router.push("/") // back to home
    } else {
      toast({ title: "Login failed", description: res.error, variant: "destructive" })
    }
  }

  return (
    <main className="container mx-auto max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-xs text-muted-foreground">
              Don’t have credentials? You can still browse the auction in read-only mode.
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
