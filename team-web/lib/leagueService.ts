import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { Game, Leader, LeagueData, Player, Post, Team } from '../types';
import { db } from './firebase';
import { calculateAvg, calculateOBP, calculateOPS, calculateSLG, getLeaders, serializeTimestamp } from './helpers';

/**
 * Fetches all data related to a league (competition)
 * @param {string} competitionId 
 * @returns {Promise<LeagueData|null>} League data or null if not found
 */
export async function getLeagueData(competitionId: string): Promise<LeagueData | null> {
    try {
        // 1. Fetch Basic League Info
        const leagueDocRef = doc(db, 'competitions', competitionId);
        const leagueDocSnap = await getDoc(leagueDocRef);

        if (!leagueDocSnap.exists()) {
            return null;
        }

        const leagueInfo = serializeTimestamp(leagueDocSnap.data());

        // 2. Fetch Games
        const gamesQuery = query(collection(db, 'competition_games'), where('competitionId', '==', competitionId));
        const gamesSnapshot = await getDocs(gamesQuery);
        const gamesList: Game[] = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamp(doc.data()) }));

        // 3. Fetch Teams and Rosters
        const teamsQuery = query(collection(db, 'competition_teams'), where('competitionId', '==', competitionId));
        const teamsSnapshot = await getDocs(teamsQuery);

        const teamsMap: { [key: string]: Team } = {};
        const allPlayersMap: { [key: string]: Player } = {};
        const playersByUserId: { [key: string]: Player } = {};

        const rosterPromises = teamsSnapshot.docs.map(async (teamDoc) => {
            const teamData = teamDoc.data();
            const teamId = teamData.teamId;

            // Fetch actual Team Document to get the latest Logo
            const realTeamDoc = await getDoc(doc(db, 'teams', teamId));
            const realTeamData = realTeamDoc.exists() ? realTeamDoc.data() : {};
            const logoURL = realTeamData.logoURL || teamData.logoURL || null;

            teamsMap[teamId] = {
                teamName: teamData.teamName,
                teamId: teamId,
                wins: 0,
                losses: 0,
                ties: 0,
                gamesPlayed: 0,
                roster: [],
                teamStats: { ab: 0, hits: 0, homeruns: 0, walks: 0, k: 0, avg: ".000" },
                logoURL: logoURL,
            };

            // Fetch Roster for each team
            const rosterQuery = collection(db, 'teams', teamId, 'roster');
            const rosterSnapshot = await getDocs(rosterQuery);

            const rosterList = rosterSnapshot.docs.map(playerDoc => {
                const playerData = serializeTimestamp(playerDoc.data());
                const playerId = playerDoc.id;

                const player: Player = {
                    id: playerId,
                    ...playerData,
                    playerName: playerData.playerName || playerData.name || 'Unknown',
                    teamId: teamId,
                    teamName: teamData.teamName,
                    photoURL: playerData.photoURL || null,
                    ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0, k: 0,
                    rbi: 0, sf: 0, hbp: 0,
                };

                teamsMap[teamId].roster.push(player);
                allPlayersMap[playerId] = player;

                if (playerData.userId) {
                    playersByUserId[playerData.userId] = player;
                }

                return playerData;
            });

            // Process Team Manager / Owner for Fallback
            const potentialManagerIds = [teamData.managerId, teamData.userId, teamData.ownerId].filter(Boolean);
            potentialManagerIds.forEach(mgrId => {
                if (mgrId && !playersByUserId[mgrId]) {
                    // Create a pseudo-player entry for the manager to reuse existing mapping logic
                    playersByUserId[mgrId] = {
                        id: mgrId,
                        playerName: teamData.teamName || teamData.name || 'Team Manager',
                        teamId: teamId,
                        teamName: teamData.teamName,
                        photoURL: teamsMap[teamId].logoURL || teamData.logoUrl || teamData.logo || null,
                        ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0, k: 0,
                        rbi: 0, sf: 0, hbp: 0,
                    } as Player;
                }
            });

            return rosterList;
        });

        await Promise.all(rosterPromises);

        // 4. Process Games to Calculate Stats and Standings
        gamesList.forEach(game => {
            const homeTeamId = game.homeTeamId;
            const awayTeamId = game.awayTeamId;

            // Standings Logic
            if (game.status === 'completed') {
                const homeScore = Number(game.homeScore) || 0;
                const awayScore = Number(game.awayScore) || 0;

                if (teamsMap[homeTeamId] && teamsMap[awayTeamId]) {
                    teamsMap[homeTeamId].gamesPlayed++;
                    teamsMap[awayTeamId].gamesPlayed++;

                    if (homeScore > awayScore) {
                        teamsMap[homeTeamId].wins++;
                        teamsMap[awayTeamId].losses++;
                    } else if (awayScore > homeScore) {
                        teamsMap[homeTeamId].losses++;
                        teamsMap[awayTeamId].wins++;
                    } else {
                        teamsMap[homeTeamId].ties++;
                        teamsMap[awayTeamId].ties++;
                    }
                }
            }

            // Player Stats Logic
            const processBoxScore = (boxScore: any[], teamId: string) => {
                if (!boxScore || !Array.isArray(boxScore) || !teamsMap[teamId]) return;

                boxScore.forEach(playerStat => {
                    const playerId = playerStat.id;
                    if (playerId && allPlayersMap[playerId]) {
                        allPlayersMap[playerId].ab += (playerStat.game_ab || 0);
                        allPlayersMap[playerId].hits += (playerStat.game_hits || 0);
                        allPlayersMap[playerId].doubles += (playerStat.game_doubles || 0);
                        allPlayersMap[playerId].triples += (playerStat.game_triples || 0);
                        allPlayersMap[playerId].homeruns += (playerStat.game_homeruns || 0);
                        allPlayersMap[playerId].walks += (playerStat.game_walks || 0);
                        allPlayersMap[playerId].k += (playerStat.game_k || 0);
                        allPlayersMap[playerId].rbi += (playerStat.game_rbi || 0);
                        allPlayersMap[playerId].sf += (playerStat.game_sf || 0);
                        allPlayersMap[playerId].hbp += (playerStat.game_hbp || 0);

                        // Team Stats Accumulation
                        teamsMap[teamId].teamStats.ab += (playerStat.game_ab || 0);
                        teamsMap[teamId].teamStats.hits += (playerStat.game_hits || 0);
                        teamsMap[teamId].teamStats.homeruns += (playerStat.game_homeruns || 0);
                        teamsMap[teamId].teamStats.walks += (playerStat.game_walks || 0);
                        teamsMap[teamId].teamStats.k += (playerStat.game_k || 0);
                    }
                });
            };

            processBoxScore(game.homeBoxScore || [], homeTeamId);
            processBoxScore(game.awayBoxScore || [], awayTeamId);

            // Enrich Game with Team Logos
            if (teamsMap[homeTeamId]) game.homeTeamLogo = teamsMap[homeTeamId].logoURL;
            if (teamsMap[awayTeamId]) game.awayTeamLogo = teamsMap[awayTeamId].logoURL;
        });

        // 5. Final Calculations (Averages, Sorting)
        const leaguePlayerStats = Object.values(allPlayersMap).map(player => ({
            ...player,
            teamLogo: teamsMap[player.teamId] ? teamsMap[player.teamId].logoURL : null,
            avg: calculateAvg(player.hits, player.ab),
            obp: calculateOBP(player.hits, player.ab, player.walks, player.hbp, player.sf),
            slg: calculateSLG(player.hits, player.ab, player.doubles, player.triples, player.homeruns),
            ops: calculateOPS(player.hits, player.ab, player.walks, player.hbp, player.sf, player.doubles, player.triples, player.homeruns)
        })).sort((a, b) => b.hits - a.hits);

        Object.values(teamsMap).forEach(team => {
            team.teamStats.avg = calculateAvg(team.teamStats.hits, team.teamStats.ab);
        });

        const standings = Object.values(teamsMap).sort((a, b) => {
            if (a.wins !== b.wins) return b.wins - a.wins;
            return a.losses - b.losses;
        });

        const sortedGames = gamesList.sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

        // 6. Calculate Leaders
        const qualifiedPlayers = leaguePlayerStats.filter(p => p.ab > 0);
        const leagueLeaders: Leader[] = [
            getLeaders("AVG", qualifiedPlayers, p => p.hits / p.ab, true),
            getLeaders("H", qualifiedPlayers, p => p.hits),
            getLeaders("HR", qualifiedPlayers, p => p.homeruns),
            getLeaders("OPS", qualifiedPlayers, p => parseFloat(p.ops || "0"), true),
        ].map(leader => {
            if (leader.player && leader.player.teamId && teamsMap[leader.player.teamId]) {
                leader.teamLogo = teamsMap[leader.player.teamId].logoURL;
            }
            return leader;
        });

        // Top 10 Batters (AVG)
        const topBatters = qualifiedPlayers
            .sort((a, b) => {
                const avgA = a.ab > 0 ? a.hits / a.ab : 0;
                const avgB = b.ab > 0 ? b.hits / b.ab : 0;
                return avgB - avgA;
            })
            .slice(0, 10)
            .map(p => ({
                ...p,
                teamLogo: teamsMap[p.teamId] ? teamsMap[p.teamId].logoURL : null
            }));

        // 7. Fetch Recent Posts
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const postsQuery = query(
            collection(db, 'mediaPosts'),
            where('competitionId', '==', competitionId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const postsSnapshot = await getDocs(postsQuery);
        let recentPosts: Post[] = postsSnapshot.docs.map(doc =>
            serializeTimestamp({ id: doc.id, ...doc.data() })
        );

        // Fetch missing users (generic users not in roster/manager)
        const participantIds = new Set(recentPosts.map(p => p.userId));
        const missingUserIds = Array.from(participantIds).filter(uid => uid && !playersByUserId[uid]);

        if (missingUserIds.length > 0) {
            const userPromises = missingUserIds.map(async (uid) => {
                if (!uid) return;
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        // Add to playersByUserId as a fallback entry
                        playersByUserId[uid] = {
                            id: uid,
                            playerName: data.displayName || data.name || 'User',
                            photoURL: data.photoURL || data.profilePicture || null,
                        } as any; // Cast as any or partial Player to satisfy type
                    }
                } catch (e) {
                    console.error(`Error fetching user ${uid}:`, e);
                }
            });
            await Promise.all(userPromises);
        }

        // Enrich recent posts with player info
        recentPosts = recentPosts.map(post => {
            if (post.userId && playersByUserId[post.userId]) {
                return {
                    ...post,
                    userPhotoUrl: post.userPhotoUrl || playersByUserId[post.userId].photoURL,
                    userName: post.userName || playersByUserId[post.userId].playerName
                };
            }
            return post;
        });

        return {
            info: { id: leagueDocSnap.id, ...leagueInfo },
            games: sortedGames,
            standings: standings,
            leaguePlayerStats: leaguePlayerStats,
            leagueLeaders: leagueLeaders,
            topBatters: topBatters,
            recentPosts: recentPosts,
        };

    } catch (error) {
        console.error("Error in getLeagueData:", error);
        throw error;
    }
}
