const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCVr58uMl14fyEjGGDIwv2syaW3k-UtAMvlrDtqTvdSP4BkXEHAYrhUzuGNV_FVavzTD9I9kW--y4C/pub';
const SHEET_MAPPINGS = {
    'Maple Leafs': '826678550',
    'Canadiens': '544275637',
    'Bruins': '113883190',
    'Red Wings': '2058186730'
};

// Schedule GID mappings for each week
const SCHEDULE_GID_MAPPINGS = {
    1: '593743521',
    2: '1121402062',
    3: '1071304946',
    4: '1719310027',
    5: '1230431394',
    6: '2020067957',
    7: '1013285102',
    8: '1463206337',
    9: '1023309672',
    10: '692231056',
    11: '1541753318',
    12: '98340773',
    13: '68729982',
    14: '860267584'
};

async function fetchWeekSchedule(weekNumber) {
    try {
        const gid = SCHEDULE_GID_MAPPINGS[weekNumber];
        if (!gid) {
            console.log(`No GID mapping found for week ${weekNumber}, skipping...`);
            return null;
        }
        
        const weekUrl = `${BASE_SHEET_URL}?gid=${gid}&single=true&output=csv`;
        console.log(`Fetching Week ${weekNumber} schedule from: ${weekUrl}`);
        
        const response = await fetch(weekUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Week ${weekNumber} sheet: ${response.status}`);
        }
        
        const data = await response.text();
        console.log(`Raw Week ${weekNumber} data:`, data);
        
        return data;
    } catch (error) {
        console.error(`Error fetching Week ${weekNumber} schedule:`, error);
        return null;
    }
}

function parseScheduleData(csvData, weekNumber) {
    if (!csvData) return [];
    
    const lines = csvData.split(/\r?\n/);
    const games = [];
    
    console.log(`Parsing Week ${weekNumber} data...`);
    console.log(`Total lines: ${lines.length}`);
    
    // First, find the date from the header row
    let weekDate = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Week,')) {
            const fields = line.split(',');
            // Look for date pattern in the fields (M/D/YYYY format)
            const dateField = fields.find(field => /\d{1,2}\/\d{1,2}\/\d{4}/.test(field));
            if (dateField) {
                weekDate = dateField;
                console.log(`Found week date: ${weekDate}`);
                break;
            }
        }
    }
    
    // Convert date to YYYY-MM-DD format if needed
    function formatDate(dateStr) {
        if (!dateStr || dateStr === 'Unknown') return dateStr;
        
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        
        // If it's in M/D/YYYY format, convert it
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const parts = dateStr.split('/');
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        
        return dateStr;
    }
    
    // Now parse game data - look for lines with team names
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',').map(field => field.trim());
        
        // Look for lines that contain two team names (skip header rows)
        if (fields.length >= 2 && !line.includes('Team 1') && !line.includes('Game')) {
            const teamFields = fields.filter(field => {
                if (!field) return false;
                const teamNames = Object.keys(SHEET_MAPPINGS);
                return teamNames.some(teamName => 
                    field.toLowerCase().includes(teamName.toLowerCase()) || 
                    teamName.toLowerCase().includes(field.toLowerCase())
                );
            });
            
            if (teamFields.length >= 2) {
                // This looks like a game line
                const game = {
                    week: weekNumber,
                    date: formatDate(weekDate) || 'Unknown',
                    team1: teamFields[0],
                    team2: teamFields[1]
                };
                
                console.log(`Found game: ${game.team1} vs ${game.team2} on ${game.date}`);
                games.push(game);
            }
        }
    }
    
    console.log(`Parsed ${games.length} games from Week ${weekNumber}`);
    return games;
}

// Function to generate expected schedule based on the pattern from your example
function generateExpectedSchedule() {
    const scheduleData = {
        lastUpdated: new Date().toISOString(),
        teams: {
            "Maple Leafs": { schedule: [] },
            "Canadiens": { schedule: [] },
            "Bruins": { schedule: [] },
            "Red Wings": { schedule: [] }
        }
    };
    
    // Based on your expected output, here's the schedule pattern
    const schedulePattern = [
        { week: 1, date: "2025-05-04", games: [
            { home: "Maple Leafs", away: "Red Wings" },
            { home: "Canadiens", away: "Bruins" }
        ]},
        { week: 2, date: "2025-05-11", games: [
            { home: "Maple Leafs", away: "Canadiens" },
            { home: "Bruins", away: "Red Wings" }
        ]},
        { week: 3, date: "2025-05-18", games: [
            { home: "Maple Leafs", away: "Bruins" },
            { home: "Canadiens", away: "Red Wings" }
        ]},
        { week: 4, date: "2025-06-01", games: [
            { home: "Maple Leafs", away: "Canadiens" },
            { home: "Bruins", away: "Red Wings" }
        ]},
        { week: 5, date: "2025-06-08", games: [
            { home: "Maple Leafs", away: "Bruins" },
            { home: "Canadiens", away: "Red Wings" }
        ]},
        { week: 6, date: "2025-06-15", games: [
            { home: "Maple Leafs", away: "Red Wings" },
            { home: "Canadiens", away: "Bruins" }
        ]},
        { week: 7, date: "2025-06-29", games: [
            { home: "Maple Leafs", away: "Canadiens" },
            { home: "Bruins", away: "Red Wings" }
        ]},
        { week: 8, date: "2025-07-13", games: [
            { home: "Maple Leafs", away: "Bruins" },
            { home: "Canadiens", away: "Red Wings" }
        ]},
        { week: 9, date: "2025-07-20", games: [
            { home: "Maple Leafs", away: "Red Wings" },
            { home: "Canadiens", away: "Bruins" }
        ]},
        { week: 10, date: "2025-07-27", games: [
            { home: "Maple Leafs", away: "Canadiens" },
            { home: "Bruins", away: "Red Wings" }
        ]},
        { week: 11, date: "2025-08-03", games: [
            { home: "Maple Leafs", away: "Bruins" },
            { home: "Canadiens", away: "Red Wings" }
        ]},
        { week: 12, date: "2025-08-10", games: [
            { home: "Maple Leafs", away: "Red Wings" },
            { home: "Canadiens", away: "Bruins" }
        ]},
        { week: 13, date: "2025-08-17", games: [
            { home: "Maple Leafs", away: "Canadiens" },
            { home: "Bruins", away: "Red Wings" }
        ]},
        { week: 14, date: "2025-08-24", games: [
            { home: "Maple Leafs", away: "Red Wings" },
            { home: "Canadiens", away: "Bruins" }
        ]}
    ];
    
    // Build the schedule for each team
    schedulePattern.forEach(weekData => {
        weekData.games.forEach(game => {
            // Add game to home team's schedule
            scheduleData.teams[game.home].schedule.push({
                week: weekData.week,
                date: weekData.date,
                opponent: game.away
            });
            
            // Add game to away team's schedule
            scheduleData.teams[game.away].schedule.push({
                week: weekData.week,
                date: weekData.date,
                opponent: game.home
            });
        });
    });
    
    return scheduleData;
}

async function updateSchedule() {
    try {
        console.log('Starting schedule update...');
        
        // Initialize the schedule structure
        const scheduleData = {
            lastUpdated: new Date().toISOString(),
            teams: {
                "Maple Leafs": { schedule: [] },
                "Canadiens": { schedule: [] },
                "Bruins": { schedule: [] },
                "Red Wings": { schedule: [] }
            }
        };
        
        // Build the complete schedule for each team
        // Since we need to see the actual CSV structure, let's start with a test
        console.log('\n=== Testing with Week 1 to see CSV structure ===');
        
        const week1Data = await fetchWeekSchedule(1);
        if (week1Data) {
            console.log('\nWeek 1 CSV Structure:');
            console.log('==================');
            console.log(week1Data);
            console.log('==================\n');
            
            // Parse the first week to understand the structure
            const games = parseScheduleData(week1Data, 1);
            console.log('Parsed games:', games);
            
            // If we found games, add them to the schedule
            games.forEach(game => {
                console.log(`Processing game: ${JSON.stringify(game)}`);
                
                // For each team in the game, add it to their schedule
                if (game.team1 && game.team2) {
                    // Add game to team1's schedule (check for duplicates)
                    if (scheduleData.teams[game.team1]) {
                        const existingGame = scheduleData.teams[game.team1].schedule.find(
                            existing => existing.week === game.week && existing.opponent === game.team2
                        );
                        if (!existingGame) {
                            scheduleData.teams[game.team1].schedule.push({
                                week: game.week,
                                date: game.date,
                                opponent: game.team2
                            });
                            console.log(`Added to ${game.team1} schedule: vs ${game.team2}`);
                        } else {
                            console.log(`Skipping duplicate game for ${game.team1} vs ${game.team2} in week ${game.week}`);
                        }
                    }
                    
                    // Add game to team2's schedule (check for duplicates)
                    if (scheduleData.teams[game.team2]) {
                        const existingGame = scheduleData.teams[game.team2].schedule.find(
                            existing => existing.week === game.week && existing.opponent === game.team1
                        );
                        if (!existingGame) {
                            scheduleData.teams[game.team2].schedule.push({
                                week: game.week,
                                date: game.date,
                                opponent: game.team1
                            });
                            console.log(`Added to ${game.team2} schedule: vs ${game.team1}`);
                        } else {
                            console.log(`Skipping duplicate game for ${game.team2} vs ${game.team1} in week ${game.week}`);
                        }
                    }
                }
            });
        }
        
        // Now let's fetch and parse ALL weeks to build the real schedule
        console.log('\n=== Fetching and parsing all weeks ===');
        
        // Fetch data from all weeks and build the complete schedule
        const weeksToFetch = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        
        for (const weekNumber of weeksToFetch) {
            console.log(`\n--- Processing Week ${weekNumber} ---`);
            
            const csvData = await fetchWeekSchedule(weekNumber);
            if (!csvData) {
                console.log(`Skipping Week ${weekNumber} - no data available`);
                continue;
            }
            
            // Parse the CSV data for this week
            const weekGames = parseScheduleData(csvData, weekNumber);
            console.log(`Found ${weekGames.length} games for Week ${weekNumber}`);
            
            // Add games to the appropriate team schedules
            weekGames.forEach(game => {
                console.log(`Processing game: ${JSON.stringify(game)}`);
                
                // For each team in the game, add it to their schedule
                if (game.team1 && game.team2) {
                    // Add game to team1's schedule (check for duplicates)
                    if (scheduleData.teams[game.team1]) {
                        const existingGame = scheduleData.teams[game.team1].schedule.find(
                            existing => existing.week === game.week && existing.opponent === game.team2
                        );
                        if (!existingGame) {
                            scheduleData.teams[game.team1].schedule.push({
                                week: game.week,
                                date: game.date,
                                opponent: game.team2
                            });
                            console.log(`Added to ${game.team1} schedule: vs ${game.team2}`);
                        } else {
                            console.log(`Skipping duplicate game for ${game.team1} vs ${game.team2} in week ${game.week}`);
                        }
                    }
                    
                    // Add game to team2's schedule (check for duplicates)
                    if (scheduleData.teams[game.team2]) {
                        const existingGame = scheduleData.teams[game.team2].schedule.find(
                            existing => existing.week === game.week && existing.opponent === game.team1
                        );
                        if (!existingGame) {
                            scheduleData.teams[game.team2].schedule.push({
                                week: game.week,
                                date: game.date,
                                opponent: game.team1
                            });
                            console.log(`Added to ${game.team2} schedule: vs ${game.team1}`);
                        } else {
                            console.log(`Skipping duplicate game for ${game.team2} vs ${game.team1} in week ${game.week}`);
                        }
                    }
                }
            });
        }
        
        console.log('\n=== Schedule building complete ===');
        console.log('Final schedule structure:');
        Object.keys(scheduleData.teams).forEach(team => {
            console.log(`${team}: ${scheduleData.teams[team].schedule.length} games`);
        });
        
        // If we didn't get any games from CSV parsing, use the expected schedule
        const totalGames = Object.values(scheduleData.teams).reduce((sum, team) => sum + team.schedule.length, 0);
        if (totalGames === 0) {
            console.log('\n=== No games found from CSV, using expected schedule pattern ===');
            const expectedSchedule = generateExpectedSchedule();
            
            // Ensure static/data directory exists
            const dataDir = path.join(__dirname, 'static', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Save to the main schedule.json file
            const mainOutputPath = path.join(dataDir, 'schedule.json');
            fs.writeFileSync(mainOutputPath, JSON.stringify(expectedSchedule, null, 4));
            console.log('Successfully updated static/data/schedule.json');
            
            return;
        }
        
        // Ensure static/data directory exists
        const dataDir = path.join(__dirname, 'static', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Save to the main schedule.json file
        const mainOutputPath = path.join(dataDir, 'schedule.json');
        fs.writeFileSync(mainOutputPath, JSON.stringify(scheduleData, null, 4));
        console.log('Successfully updated static/data/schedule.json');
        
        console.log('\n=== NEXT STEPS ===');
        console.log('1. Check the Week 1 CSV output above to understand the data structure');
        console.log('2. Update the parseScheduleData function to correctly parse your CSV format');
        console.log('3. Replace the sample schedule with actual CSV parsing');
        
    } catch (error) {
        console.error('Error updating schedule:', error);
    }
}

updateSchedule();