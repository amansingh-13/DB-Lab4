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
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.get('/matches', async (req, res) => {
	const query = `
		SELECT match_id, T1.team_name AS team1, T2.team_name AS team2,
		       venue_name, city_name, T3.team_name AS match_winner, win_type, win_margin
		FROM match, venue, team AS T1, team AS T2, team AS T3 
		WHERE match.venue_id = venue.venue_id AND 
		      match.team1 = T1.team_id AND 
		      match.team2 = T2.team_id AND 
		      match.match_winner = T3.team_id 
		ORDER BY season_year DESC, match_id DESC 
		LIMIT $1 OFFSET $2
	`
	try {
		const resp = await client.query(query, [req.query.limit, req.query.skip])
		res.json(resp.rows)
	}
	catch (e) { console.log(e); res.json({"error":"ERR in /matches"}) }
})

app.get('/matches/:match_id', async (req, res) => {
	// wides, no-balls will also be counted in the balls_faced column
	// extra runs scored through these deliveries wont be counted though
	const bat_query = `
		SELECT player_id, player_name AS batter, SUM(runs_scored)::int AS runs, 
		       COUNT(*)::int AS balls_faced,
		       COUNT(*) FILTER (WHERE runs_scored = 4)::int AS fours, 
		       COUNT(*) FILTER (WHERE runs_scored = 6)::int AS sixes
		FROM ball_by_ball, player
		WHERE striker = player_id AND
		      match_id = $1 AND
		      innings_no = $2
		GROUP BY player_id, player_name
		ORDER BY runs DESC, balls_faced ASC, player_name ASC
	`
	// should extra_runs be added in runs_given? in balls_bowled?
	const bowl_query = `
		SELECT player_id, player_name AS bowler, COUNT(*)::int AS balls_bowled, 
		       COUNT(*)::int AS balls_bowled,
		       SUM(runs_scored)::int AS runs_given, 
		       COUNT(*) FILTER (WHERE out_type IS NOT NULL AND
		                              out_type <> 'run out' AND
		                              out_type <> 'retired hurt')::int AS wickets,
		       COUNT(DISTINCT over_id)::int AS overs_bowled
		FROM ball_by_ball, player
		WHERE bowler = player_id AND
		      match_id = $1 AND
		      innings_no = $2
		GROUP BY player_id, player_name
		ORDER BY wickets DESC, balls_bowled ASC, player_name ASC
	`
	const info_query = `
		SELECT match_id, T1.team_name AS team1, T2.team_name AS team2,
		       season_year, T3.team_name AS toss_winner, toss_name, venue_name,
		       T4.team_name AS match_winner, win_type, win_margin, city_name
		FROM match, team AS T1, team AS T2, team AS T3, team AS T4, venue
		WHERE match_id = $1 AND 
		      match.venue_id = venue.venue_id AND 
		      match.team1 = T1.team_id AND 
		      match.team2 = T2.team_id AND 
		      match.toss_winner = T3.team_id AND
		      match.match_winner = T4.team_id 
	`

	const total_query = `
		SELECT DISTINCT over_id, (SELECT SUM(runs_scored)::int+SUM(extra_runs)::int 
			   FROM ball_by_ball AS b2 
			   WHERE match_id = $1 AND innings_no = $2 AND b2.over_id <= b1.over_id)
		       AS total
		FROM ball_by_ball AS b1
		WHERE match_id = $1 AND innings_no = $2
		ORDER BY over_id ASC
	`
	const wicket_query = `
		SELECT over_id, 
		       (CASE WHEN COUNT(out_type) = 0 THEN 0 ELSE 1 END)::int AS out
		FROM ball_by_ball WHERE match_id = $1 AND innings_no = $2 
		GROUP BY over_id ORDER BY over_id ASC
	`

	const agg_query = `
		SELECT SUM(runs_scored) FILTER (WHERE runs_scored = 1)::int AS ones,
		       SUM(runs_scored) FILTER (WHERE runs_scored = 2)::int  AS twos,
		       SUM(runs_scored) FILTER (WHERE runs_scored = 3)::int  AS threes,
		       SUM(runs_scored) FILTER (WHERE runs_scored = 4)::int  AS fours,
		       SUM(runs_scored) FILTER (WHERE runs_scored = 6)::int  AS sixes,
		       SUM(extra_runs)::int AS extras,
			   SUM(runs_scored)::int+SUM(extra_runs)::int AS total_runs,
			   COUNT(out_type)::int AS total_wickets,
			   COUNT(DISTINCT over_id)::int AS overs_bowled
		FROM ball_by_ball WHERE match_id = $1 AND innings_no = $2
	`

	try {
		const bat1 = await client.query(bat_query, [req.params.match_id, 1])
		const bowl1 = await client.query(bowl_query, [req.params.match_id, 1])
		const bat2 = await client.query(bat_query, [req.params.match_id, 2])
		const bowl2 = await client.query(bowl_query, [req.params.match_id, 2])
		const info = await client.query(info_query, [req.params.match_id])
		const umpires = await client.query(
			'SELECT umpire_name FROM umpire_match NATURAL JOIN umpire WHERE match_id = $1',
			[req.params.match_id]
		)
		const team1 = await client.query(
			`SELECT player_name FROM player_match NATURAL JOIN player NATURAL JOIN match 
			WHERE match_id = $1 AND team_id = team1`, [req.params.match_id])
		const team2 = await client.query(
			`SELECT player_name FROM player_match NATURAL JOIN player NATURAL JOIN match 
			WHERE match_id = $1 AND team_id = team2`, [req.params.match_id])
		
		const total1 = await client.query(total_query, [req.params.match_id, 1])
		const wicket1 = await client.query(wicket_query, [req.params.match_id, 1])
		const total2 = await client.query(total_query, [req.params.match_id, 2])
		const wicket2 = await client.query(wicket_query, [req.params.match_id, 2])
		
		const pie1 = await client.query(agg_query, [req.params.match_id, 1])
		const pie2 = await client.query(agg_query, [req.params.match_id, 2])

		res.json({
			'bat1': bat1.rows, 'bowl1': bowl1.rows,
			'bat2': bat2.rows, 'bowl2': bowl2.rows,
			'info': info.rows[0],
			'umpires': umpires.rows,
			'team1': team1.rows, 'team2': team2.rows,

			'total1': total1.rows, 'wicket1': wicket1.rows,
			'total2': total2.rows, 'wicket2': wicket2.rows,

			'agg1': pie1.rows[0], 'agg2': pie2.rows[0]
		})
	}
	catch(e) { console.log(e); res.json({"error":"ERR in /matches/:match_id"}) }

})

app.listen(args.node, () => {
	console.log(`Server started at http://${args.host}:${args.node}/`)
})