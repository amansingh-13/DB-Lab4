const express = require('express')
const { Client } = require('pg')
const { ArgumentParser } = require('argparse')

const parser = new ArgumentParser()
parser.add_argument('--name', { 'type': 'str' })
parser.add_argument('--user', { 'type': 'str' })
parser.add_argument('--pswd', { 'type': 'str' })
parser.add_argument('--host', { 'type': 'str', 'default': 'localhost' })
parser.add_argument('--pgport', { 'type': 'int', 'default': 5432 })
parser.add_argument('--node', { 'type': 'int', 'default': 5000 })
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

const cors = require('cors');

app.use(cors());

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
	catch (e) { console.log(e); res.json({ "error": "ERR in /matches" }) }
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
		ORDER BY wickets DESC, runs_given ASC, player_name ASC
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
	catch (e) { console.log(e); res.json({ "error": "ERR in /matches/:match_id" }) }

})


app.get('/players/:player_id', async (req, res) => {

	try {
		const id = req.params.player_id

		const player_name = await client.query(`SELECT player_name from player where player_id = $1`, [id])
		const country = await client.query(`SELECT country_name from player where player_id = $1`, [id])
		const batting_style = await client.query(`SELECT batting_hand from player where player_id = $1`, [id])
		const bowling_skill = await client.query(`SELECT bowling_skill from player where player_id = $1`, [id])


		const batsman_matches = await client.query(`SELECT count(distinct match_id)::int from ball_by_ball where striker = $1 or non_striker = $1`, [id])
		const batsman_runs = await client.query(`SELECT sum(runs_scored)::int from ball_by_ball where striker = $1`, [id])
		const fours = await client.query(`SELECT count(runs_scored)::int from ball_by_ball where striker = $1 and runs_scored=4`, [id])
		const sixes = await client.query(`SELECT count(runs_scored)::int from ball_by_ball where striker = $1 and runs_scored=6`, [id])
		const fifties = await client.query(
			`WITH A as 
			(SELECT match_id,sum(runs_scored)::int as runs 
			from ball_by_ball 
			where striker = $1 
			group by match_id) 
			SELECT count(runs) from A where runs>=50 and runs<100`,
			[id])

		const max = await client.query(
			`WITH A as 
			(SELECT match_id,sum(runs_scored)::int as runs 
			from ball_by_ball 
			where striker = $1 
			group by match_id) 
			SELECT max(runs) from A`,
			[id])

		const strike_rate = await client.query(
			`SELECT ROUND((sum(runs_scored)::int)*100.0/(count(runs_scored)::int), 2) as strike_rate 
			from ball_by_ball 
			where striker=$1`,
			[id])

		const avg = await client.query(
			`SELECT ROUND((sum(runs_scored))*1.0/(count(out_type)), 2) as average 
			from ball_by_ball 
			where striker=$1`,
			[id])

		const batting_stats_graph_info
			= await client.query(
			`SELECT match_id,sum(runs_scored)::int 
			from ball_by_ball 
			where striker = $1 
			group by match_id 
			order by match_id`,
				[id])

		const bowler_matches = await client.query(`SELECT count(distinct match_id)::int from ball_by_ball where bowler = $1`, [id])
		const bowler_runs = await client.query(`SELECT sum(runs_scored)::int+sum(extra_runs)::int as runs from ball_by_ball where bowler = $1`, [id])
		const bowler_balls = await client.query(`SELECT count(runs_scored)::int from ball_by_ball where bowler = $1`, [id])
		const overs = await client.query(`SELECT count(distinct over_id)::int from ball_by_ball where bowler = $1`, [id])
		const economy 
			= await client.query(
				`SELECT 
				ROUND((sum(runs_scored)::int)*1.0/(count(distinct over_id)::int), 2) as economy
				from ball_by_ball 
				where bowler = $1`, 
				[id])

		const wkts = await client.query(
			`SELECT count(out_type)::int from ball_by_ball where bowler=$1`,
			[id])

		const five_wkts = await client.query(
			`with A as 
			(select match_id, bowler, count(out_type)::int as wkts 
			from ball_by_ball 
			group by match_id, bowler) 
			select count(match_id)::int 
			from A 
			where wkts>=5 and bowler=$1;`,
			[id])

		const bowler_graph = await client.query(
			`select count(out_type)::int as wkts, 
			sum(runs_scored)::int+sum(extra_runs)::int as runs, match_id 
			from ball_by_ball 
			where bowler=$1 
			group by match_id;`,
			[id])

		res.json({
			'basic_info': {
				'player_name': player_name.rows,
				'country': country.rows,
				'batting_style': batting_style.rows,
				'bowling_skill': bowling_skill.rows,
			},
			
			'batting_stats': {
				'matches': batsman_matches.rows,
				'runs': batsman_runs.rows,
				'fours': fours.rows,
				'sixes': sixes.rows,
				'fifties': fifties.rows,
				'max': max.rows,
				'strike_rate': strike_rate.rows,
				'average': avg.rows,
				'graph_info': batting_stats_graph_info.rows
			},

			'bowling_stats': {
				'matches': bowler_matches.rows,
				'runs': bowler_runs.rows,
				'balls': bowler_balls.rows,
				'overs': overs.rows,
				'wickets': wkts.rows,
				'economy': economy.rows,
				'five_wkts': five_wkts.rows,
				'graph_info': bowler_graph.rows
			}
		})
	}
	catch (e) { console.log(e); res.json({ "error": "ERR in /players/:player_id" }) }
})

app.get('/pointstable/:year', async (req, res) => {
	const tquery = `
		WITH ro AS (SELECT * FROM
		    (SELECT match_id, 
			    SUM(runs_scored)+SUM(extra_runs) AS r1, MAX(over_id) AS o1
		    FROM ball_by_ball WHERE innings_no=1 GROUP BY match_id) AS x
		    NATURAL JOIN                                                            
		    (SELECT match_id,
			    SUM(runs_scored)+SUM(extra_runs) AS r2, MAX(over_id) AS o2
		    FROM ball_by_ball WHERE innings_no=2 GROUP BY match_id) AS y),
		choice AS 
		    (SELECT team_id, match_id,
			    CASE WHEN match_winner=team_id THEN 1 ELSE 0 END AS won,
			    CASE WHEN (toss_winner=team_id AND toss_name='bat') OR
				      (toss_winner<>team_id AND toss_name='field') 
			    THEN 1 ELSE 2 END AS inn
		    FROM team, match
		    WHERE (team_id=team1 OR team_id=team2) AND season_year = $1)
		SELECT team_name, COUNT(*)::int as mat, SUM(won)::int as won,
		       COUNT(*)::int-SUM(won)::int as lost, 0 AS tied,
		       2*SUM(won)::int AS pts,                                                                        
		       1.0*SUM(CASE WHEN inn=1 THEN r1 ELSE r2 END)/SUM(CASE WHEN inn=1 THEN o1 ELSE o2 END) -
		       1.0*SUM(CASE WHEN inn=1 THEN r2 ELSE r1 END)/SUM(CASE WHEN inn=1 THEN o2 ELSE o1 END) AS nr
		FROM ro, choice, team 
		WHERE  team.team_id=choice.team_id AND ro.match_id=choice.match_id   
		GROUP BY team.team_id, team_name
		ORDER BY pts DESC, nr DESC, mat ASC
	`
	try {
		const table = await client.query(tquery, [req.params.year])
		res.json(table.rows)
	}
	catch (e) { console.log(e); res.json({ "error": "ERR in /pointstable/:year" }) }
})

app.get('/venues', async (req, res) => {
	try {
		const venues = await client.query(`SELECT venue_id, venue_name FROM venue`)
		res.json(venues.rows)
	}
	catch (e) { console.log(e); res.json({ "error": "ERR in /venues" }) }
})

app.get('/venue/:venue_id', async (req, res) => {
	try {
		const info_query = `
			WITH agg AS 
			(SELECT venue.venue_id, match.match_id, innings_no, win_type, 
			       SUM(runs_scored)::int+SUM(extra_runs)::int AS total
			FROM venue, match, ball_by_ball
			WHERE venue.venue_id = match.venue_id AND 
			      match.match_id = ball_by_ball.match_id
			GROUP BY venue.venue_id, match.match_id, innings_no, win_type)
			SELECT venue_name, city_name, capacity,
			       COUNT(DISTINCT match_id)::int AS matches,
			       MAX(total)::int AS max, MIN(total)::int AS min,
			       MAX(total+1) FILTER (WHERE win_type='wickets' AND innings_no=1)
			       AS max_chased
			FROM agg NATURAL JOIN venue 
			WHERE venue_id = $1
			GROUP BY venue_id, venue_name, city_name, capacity
		`
		const info = await client.query(info_query, [req.params.venue_id])
		const win = await client.query(`
			SELECT COUNT(*) FILTER (WHERE win_type='runs')::int AS first,
			       COUNT(*) FILTER (WHERE win_type='wickets')::int AS second
			FROM match WHERE venue_id = $1 GROUP BY venue_id`, [req.params.venue_id])
		const avg = await client.query(`
			SELECT season_year, 
			       1.0*(SUM(runs_scored)+SUM(extra_runs))/COUNT(DISTINCT match_id)
			       AS avg
			FROM match NATURAL JOIN ball_by_ball
			WHERE innings_no = 1 AND venue_id = $1 AND
			      season_year IN (2011, 2013, 2015, 2017)
			GROUP BY season_year ORDER BY season_year`, [req.params.venue_id])
		res.json({'info': info.rows[0], 'win': win.rows[0], 'avg': avg.rows})
	}
	catch (e) { console.log(e); res.json({ "error": "ERR in /venue/:venue_id" }) }
})


app.post('/venues/add', (req, res) => {
	try{
		//requiredData = req.body
		//console.log(requiredData)
		res.send('hello')
	}
	catch(e) {	console.log(e); res.json({ "error": "ERR in /venues/add" }) }
})


app.listen(args.node, () => {
	console.log(`Server started at http://${args.host}:${args.node}/`)
})
