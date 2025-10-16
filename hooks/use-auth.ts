"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type Role = "admin" | "viewer"
type User = { username: string; role: Role } | null

const STORAGE_KEY = "cpl-auth-v1"
const AUTH_EVENT = "cpl-auth-update"


const CREDENTIALS = [{ username: "Rama", password: "Lakshman_rlr", role: "admin" as const }] as const

function loadUser(): User {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function saveUser(user: User) {
  if (typeof window === "undefined") return
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function useAuth() {
  const [user, setUser] = useState<User>(() => loadUser())

  useEffect(() => {
    const handler = () => setUser(loadUser())
    window.addEventListener("storage", handler)
    window.addEventListener(AUTH_EVENT, handler)
    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener(AUTH_EVENT, handler)
    }
  }, [])

  const isAdmin = useMemo(() => user?.role === "admin", [user])

  const login = useCallback(async (username: string, password: string) => {
    const match = CREDENTIALS.find((c) => c.username === username && c.password === password)
    if (!match) {
      return { ok: false as const, error: "Invalid credentials" }
    }
    const next: User = { username: match.username, role: match.role }
    saveUser(next)
    setUser(next)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    saveUser(null)
    setUser(null)
  }, [])

  return { user, isAdmin, login, logout }
}
