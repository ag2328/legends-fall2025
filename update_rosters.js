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

async function fetchTeamRoster(team) {
    try {
        const gid = SHEET_MAPPINGS[team];
        const teamUrl = `${BASE_SHEET_URL}?gid=${gid}&single=true&output=csv`;
        console.log(`Fetching ${team} roster from: ${teamUrl}`);
        
        const response = await fetch(teamUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${team} sheet: ${response.status}`);
        }
        
        const data = await response.text();
        console.log(`Raw ${team} data:`, data);
        
        const lines = data.split(/\r?\n/);
        const players = [];
        
        // Simple approach: look for lines that have a number and a name (regular players)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Skip obvious non-player lines
            if (line.toLowerCase().startsWith('team name') ||
                line.toLowerCase().startsWith('coach') ||
                line.toLowerCase().includes('goalie stats') ||
                line.includes('Player #') ||
                line === ',' ||
                line === ',,,,') {
                continue;
            }
            
            // Try to parse as player data
            const fields = line.split(',').map(field => field.trim());
            const number = fields[0];
            const name = fields[1];
            
            // Must have both number and name
            if (!number || !name) continue;
            
            // Number must be a valid integer
            const playerNumber = parseInt(number);
            if (isNaN(playerNumber)) continue;
            
            // Skip goalies (players with (G) in their name)
            if (name.includes('(G)')) continue;
            
            // Skip if name looks like a header or is invalid
            if (name.toLowerCase().includes('player') || 
                name.toLowerCase().includes('name') ||
                name.toLowerCase().includes('week') ||
                name.toLowerCase().includes('goals allowed') ||
                name.toLowerCase().includes('save') ||
                name.toLowerCase().includes('shot attempts') ||
                name.match(/^\d+$/) || // Skip if name is just numbers
                name.length < 2) { // Skip very short names
                continue;
            }
            
            console.log(`Adding player: ${playerNumber} - ${name}`);
            players.push({
                number: playerNumber,
                name: name,
                goals: 0
            });
        }
        
        console.log(`Parsed ${players.length} players for ${team}:`, players);
        return players;
    } catch (error) {
        console.error(`Error fetching ${team} roster:`, error);
        return [];
    }
}

async function updateRosters() {
    try {
        const teams = ['Maple Leafs', 'Canadiens', 'Bruins', 'Red Wings'];
        const allPlayerData = {
            lastUpdated: new Date().toISOString(),
            teams: {}
        };

        for (const team of teams) {
            const players = await fetchTeamRoster(team);
            allPlayerData.teams[team] = { players };
        }

        // Ensure static/data directory exists
        const dataDir = path.join(__dirname, 'static', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save to static/data/rosters.json
        const outputPath = path.join(dataDir, 'rosters.json');
        fs.writeFileSync(outputPath, JSON.stringify(allPlayerData, null, 4));
        console.log('Successfully updated static/data/rosters.json');
    } catch (error) {
        console.error('Error updating rosters:', error);
    }
}

updateRosters(); 