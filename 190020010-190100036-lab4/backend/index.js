const express = require('express')
const { Client } = require('pg')
const { ArgumentParser } = require('argparse')

const parser = new ArgumentParser()
parser.add_argument('--name', {'type':'str'})
parser.add_argument('--user', {'type':'str'})
parser.add_argument('--pswd', {'type':'str'})
parser.add_argument('--host', {'type':'str', 'default':'localhost'})
parser.add_argument('--pgport', {'type':'int', 'default':5432})
parser.add_argument('--node', {'type':'int', 'default':5000})
const args = parser.parse_args()

const client = new Client({
	user: args.user,
	host: args.host,
	database: args.name,
	password: args.pswd,
	port: args.pgport,
})
client.connect()

const app = express()

app.get('/matches', async (req, res) => {
	query = `
		SELECT match_id, T1.team_name AS team1, T2.team_name AS team2,
		       venue_name, city_name, T3.team_name AS match_winner, win_type, win_margin
		FROM match, venue, team AS T1, team AS T2, team AS T3 
		WHERE match.venue_id = venue.venue_id AND 
		      match.team1 = T1.team_id AND 
		      match.team2 = T2.team_id AND 
		      match.match_winner = T3.team_id 
		ORDER BY season_year DESC 
		LIMIT $1 OFFSET $2
	`
	try {
		resp = await client.query(query, [req.query.limit, req.query.skip])
		res.json(resp.rows)
	} 
	catch { res.json({"error":"ERR in /matches"}) }
})

app.get('/matches/:match_id', async (req, res) => {
	res.send(req.params.match_id)
})

app.listen(args.node, () => {
	console.log(`Server started at http://${args.host}:${args.node}/`)
})
