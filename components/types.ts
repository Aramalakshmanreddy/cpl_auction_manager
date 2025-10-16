export type Player = {
  id: string
  name: string
  role?: string
  mobile?: string
  imageUrl?: string
  cricheroesId?: string
}

export type TeamPlayer = Player & {
  coins: number
}

export type Team = {
  id: string
  name: string
  players: TeamPlayer[]
}

export type AuctionState = {
  playersPool: Player[] // all known players
  teams: Team[] // 4 teams
}

export const TEAM_BUDGET = 6000
export const TEAM_SIZE_LIMIT = 16
