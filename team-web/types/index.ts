export interface Player {
    id: string;
    playerName: string;
    teamId: string;
    teamName: string;
    photoURL?: string | null;
    ab: number;
    hits: number;
    doubles: number;
    triples: number;
    homeruns: number;
    walks: number;
    k: number;
    rbi: number;
    sf: number;
    hbp: number;
    avg?: string;
    ops?: string;
    [key: string]: any;
}

export interface TeamStats {
    ab: number;
    hits: number;
    homeruns: number;
    walks: number;
    k: number;
    avg: string;
}

export interface Team {
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ties: number;
    gamesPlayed: number;
    roster: Player[];
    teamStats: TeamStats;
    logoURL?: string | null;
    [key: string]: any;
}

export interface Game {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore?: number;
    awayScore?: number;
    status: string;
    gameDate: string; // ISO string
    homeBoxScore?: any[];
    awayBoxScore?: any[];
    homeTeamLogo?: string | null;
    awayTeamLogo?: string | null;
    [key: string]: any;
}

export interface Leader {
    stat: string;
    name: string;
    value: number | string;
    player?: Player;
    teamLogo?: string | null;
}

export interface Post {
    id: string;
    createdAt: string; // ISO string
    [key: string]: any;
}

export interface LeagueInfo {
    id: string;
    name: string;
    logoUrl?: string;
    adminId?: string;
    [key: string]: any;
}

export interface LeagueData {
    info: LeagueInfo;
    games: Game[];
    standings: Team[];
    leaguePlayerStats: Player[];
    leagueLeaders: Leader[];
    topBatters: Player[];
    recentPosts: Post[];
}
