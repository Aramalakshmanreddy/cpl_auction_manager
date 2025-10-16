"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function NavbarAuth() {
  const { user, isAdmin, logout } = useAuth()
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs rounded-md border px-2 py-1">
        {isAdmin ? "Admin" : "Viewer"}
        {user?.username ? ` · ${user.username}` : ""}
      </div>
      {user ? (
        <Button size="sm" variant="outline" onClick={logout}>
          Logout
        </Button>
      ) : (
        <Button size="sm" asChild>
          <Link href="/login">Login</Link>
        </Button>
      )}
    </div>
  )
}
