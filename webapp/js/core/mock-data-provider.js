/**
 * 5ive Trackr Mock Data Provider
 * 
 * Provides mock data for local testing without server connection
 * 
 * @copyright 5ive Trackr 2025
 */

// Check if we're running locally
const isLocalTesting = window.location.protocol === 'file:';

// Only activate in local testing mode
if (isLocalTesting && window.DataManager) {
    console.log('Setting up mock data for local testing');
    
    // Sample data for testing
    const mockData = {
        leagues: [
            {
                id: 'league-1',
                name: 'Premier League',
                description: 'Top division football league',
                teams: ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6'],
                active: true,
                startDate: '2025-03-15',
                endDate: '2025-11-30',
                location: 'National Stadium',
                standings: [
                    {
                        teamId: 'team-1',
                        teamName: 'Manchester United',
                        played: 10,
                        won: 7,
                        drawn: 2,
                        lost: 1,
                        goalsFor: 22,
                        goalsAgainst: 8,
                        points: 23
                    },
                    {
                        teamId: 'team-2',
                        teamName: 'Liverpool FC',
                        played: 10,
                        won: 6,
                        drawn: 3,
                        lost: 1,
                        goalsFor: 18,
                        goalsAgainst: 7,
                        points: 21
                    },
                    {
                        teamId: 'team-3',
                        teamName: 'Arsenal',
                        played: 10,
                        won: 6,
                        drawn: 1,
                        lost: 3,
                        goalsFor: 15,
                        goalsAgainst: 10,
                        points: 19
                    },
                    {
                        teamId: 'team-4',
                        teamName: 'Chelsea FC',
                        played: 10,
                        won: 5,
                        drawn: 2,
                        lost: 3,
                        goalsFor: 14,
                        goalsAgainst: 11,
                        points: 17
                    },
                    {
                        teamId: 'team-5',
                        teamName: 'Manchester City',
                        played: 10,
                        won: 5,
                        drawn: 1,
                        lost: 4,
                        goalsFor: 16,
                        goalsAgainst: 12,
                        points: 16
                    },
                    {
                        teamId: 'team-6',
                        teamName: 'Tottenham Hotspur',
                        played: 10,
                        won: 4,
                        drawn: 3,
                        lost: 3,
                        goalsFor: 12,
                        goalsAgainst: 11,
                        points: 15
                    }
                ]
            },
            {
                id: 'league-2',
                name: 'Championship League',
                description: 'Second division football league',
                teams: ['team-7', 'team-8', 'team-9', 'team-10'],
                active: true,
                startDate: '2025-03-20',
                endDate: '2025-12-10',
                location: 'City Stadium'
            }
        ],
        teams: [
            {
                id: 'team-1',
                name: 'Manchester United',
                leagueId: 'league-1',
                captain: 'player-1',
                players: ['player-1', 'player-2', 'player-3'],
                color: '#FF0000'
            },
            {
                id: 'team-2',
                name: 'Liverpool FC',
                leagueId: 'league-1',
                captain: 'player-4',
                players: ['player-4', 'player-5', 'player-6'],
                color: '#B31B1B'
            },
            {
                id: 'team-3',
                name: 'Arsenal',
                leagueId: 'league-1',
                captain: 'player-7',
                players: ['player-7', 'player-8', 'player-9'],
                color: '#EF0107'
            },
            {
                id: 'team-4',
                name: 'Chelsea FC',
                leagueId: 'league-1',
                captain: 'player-10',
                players: ['player-10', 'player-11', 'player-12'],
                color: '#0a4595'
            },
            {
                id: 'team-5',
                name: 'Manchester City',
                leagueId: 'league-1',
                captain: 'player-13',
                players: ['player-13', 'player-14', 'player-15'],
                color: '#6CABDD'
            },
            {
                id: 'team-6',
                name: 'Tottenham Hotspur',
                leagueId: 'league-1',
                captain: 'player-16',
                players: ['player-16', 'player-17', 'player-18'],
                color: '#132257'
            }
        ],
        fixtures: [
            {
                id: 'fixture-1',
                leagueId: 'league-1',
                homeTeamId: 'team-1',
                awayTeamId: 'team-2',
                date: '2025-04-05T15:00:00',
                venue: 'Old Trafford',
                homeScore: 2,
                awayScore: 1,
                isCompleted: true,
                refereeId: 'referee-1'
            },
            {
                id: 'fixture-2',
                leagueId: 'league-1',
                homeTeamId: 'team-3',
                awayTeamId: 'team-4',
                date: '2025-04-06T14:00:00',
                venue: 'Emirates Stadium',
                homeScore: 0,
                awayScore: 0,
                isCompleted: true,
                refereeId: 'referee-2'
            },
            {
                id: 'fixture-3',
                leagueId: 'league-1',
                homeTeamId: 'team-5',
                awayTeamId: 'team-6',
                date: '2025-04-12T16:30:00',
                venue: 'Etihad Stadium',
                isCompleted: false,
                refereeId: 'referee-3'
            }
        ],
        players: [
            {
                id: 'player-1',
                name: 'Bruno Fernandes',
                teamId: 'team-1',
                position: 'MID',
                number: 8,
                stats: {
                    goals: 7,
                    assists: 5,
                    yellowCards: 2,
                    redCards: 0
                }
            },
            {
                id: 'player-4',
                name: 'Mohamed Salah',
                teamId: 'team-2',
                position: 'FWD',
                number: 11,
                stats: {
                    goals: 9,
                    assists: 3,
                    yellowCards: 1,
                    redCards: 0
                }
            }
        ]
    };
    
    // Override DataManager methods
    DataManager.prototype.getLeagues = function() {
        return Promise.resolve(mockData.leagues);
    };
    
    DataManager.prototype.getLeague = function(leagueId) {
        const league = mockData.leagues.find(l => l.id === leagueId);
        return Promise.resolve(league || null);
    };
    
    DataManager.prototype.getTeamsByLeague = function(leagueId) {
        const teams = mockData.teams.filter(t => t.leagueId === leagueId);
        return Promise.resolve(teams);
    };
    
    DataManager.prototype.getFixturesByLeague = function(leagueId) {
        const fixtures = mockData.fixtures.filter(f => f.leagueId === leagueId);
        return Promise.resolve(fixtures);
    };
    
    DataManager.prototype.updateLeague = function(league) {
        console.log('Mock updating league:', league);
        return Promise.resolve({ success: true });
    };
    
    DataManager.prototype.deleteLeague = function(leagueId) {
        console.log('Mock deleting league:', leagueId);
        return Promise.resolve({ success: true });
    };
    
    console.log('Mock data provider initialized');
}
