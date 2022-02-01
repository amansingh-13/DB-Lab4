--
-- PostgreSQL database dump
--

-- Dumped from database version 12.9 (Ubuntu 12.9-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.9 (Ubuntu 12.9-0ubuntu0.20.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: check_attendance(); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.check_attendance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (SELECT capacity FROM venue WHERE venue_id = NEW.venue_id) < NEW.attendance THEN
	RAISE EXCEPTION 'attendance > capacity';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_attendance() OWNER TO aman;

--
-- Name: check_stake(); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.check_stake() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (SELECT SUM(stake) FROM owner WHERE owner.team_id = NEW.team_id) + NEW.stake > 100 THEN
        RAISE EXCEPTION 'total stake > 100';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_stake() OWNER TO aman;

--
-- Name: check_umpires(); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.check_umpires() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.role_desc = 'Field' AND (SELECT COUNT(*) FROM umpire_match WHERE match_id = NEW.match_id AND role_desc = 'Field') >= 2
    THEN
	RAISE EXCEPTION 'field umpires > 2';
    END IF;
    IF NEW.role_desc = 'Third' AND (SELECT COUNT(*) FROM umpire_match WHERE match_id = NEW.match_id AND role_desc = 'Third') >= 1 
    THEN
	RAISE EXCEPTION 'third umpires > 1';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_umpires() OWNER TO aman;

--
-- Name: hmm(integer); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.hmm(x integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
begin INSERT INTO venue VALUES (22,'hm','hm','hm',333);
return x*x; end;
$$;


ALTER FUNCTION public.hmm(x integer) OWNER TO aman;

--
-- Name: hmmm(integer); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.hmmm(x integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
begin INSERT INTO venue VALUES (23,'hm','hm','hm',333);
return NULL; end;
$$;


ALTER FUNCTION public.hmmm(x integer) OWNER TO aman;

--
-- Name: lol(integer); Type: FUNCTION; Schema: public; Owner: aman
--

CREATE FUNCTION public.lol(x integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
begin INSERT INTO venue VALUES (22,"hm","hm","hm",333);
return x*x; end;
$$;


ALTER FUNCTION public.lol(x integer) OWNER TO aman;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ball_by_ball; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.ball_by_ball (
    match_id integer NOT NULL,
    innings_no integer NOT NULL,
    over_id integer NOT NULL,
    ball_id integer NOT NULL,
    runs_scored integer,
    extra_runs integer,
    out_type text,
    striker integer,
    non_striker integer,
    bowler integer,
    CONSTRAINT ball_by_ball_innings_no_check CHECK (((innings_no IS NOT NULL) AND ((innings_no = 1) OR (innings_no = 2)))),
    CONSTRAINT ball_by_ball_out_type_check CHECK (((out_type = 'caught'::text) OR (out_type = 'caught and bowled'::text) OR (out_type = 'bowled'::text) OR (out_type = 'stumped'::text) OR (out_type = 'retired hurt'::text) OR (out_type = 'keeper catch'::text) OR (out_type = 'lbw'::text) OR (out_type = 'run out'::text) OR (out_type = 'hit wicket'::text) OR (out_type IS NULL))),
    CONSTRAINT ball_by_ball_runs_scored_check CHECK (((runs_scored IS NOT NULL) AND ((runs_scored >= 0) AND (runs_scored <= 6))))
);


ALTER TABLE public.ball_by_ball OWNER TO aman;

--
-- Name: match; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.match (
    match_id integer NOT NULL,
    season_year integer,
    team1 integer,
    team2 integer,
    venue_id integer,
    toss_winner integer,
    match_winner integer,
    toss_name text,
    win_type text,
    man_of_match integer,
    win_margin integer,
    attendance integer,
    CONSTRAINT match_attendance_check CHECK ((attendance IS NOT NULL)),
    CONSTRAINT match_toss_name_check CHECK (((toss_name IS NOT NULL) AND ((toss_name = 'field'::text) OR (toss_name = 'bat'::text)))),
    CONSTRAINT match_win_type_check CHECK (((win_type = 'wickets'::text) OR (win_type = 'runs'::text) OR (win_type IS NULL)))
);


ALTER TABLE public.match OWNER TO aman;

--
-- Name: owner; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.owner (
    owner_id integer NOT NULL,
    owner_name text,
    owner_type text,
    team_id integer,
    stake integer,
    CONSTRAINT owner_stake_check CHECK (((stake IS NOT NULL) AND ((stake >= 1) AND (stake <= 100))))
);


ALTER TABLE public.owner OWNER TO aman;

--
-- Name: player; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.player (
    player_id integer NOT NULL,
    player_name text,
    dob date,
    batting_hand text,
    bowling_skill text,
    country_name text
);


ALTER TABLE public.player OWNER TO aman;

--
-- Name: player_match; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.player_match (
    playermatch_key bigint NOT NULL,
    match_id integer,
    player_id integer,
    role_desc text,
    team_id integer,
    CONSTRAINT player_match_role_desc_check CHECK (((role_desc IS NOT NULL) AND ((role_desc = 'Player'::text) OR (role_desc = 'Keeper'::text) OR (role_desc = 'CaptainKeeper'::text) OR (role_desc = 'Captain'::text))))
);


ALTER TABLE public.player_match OWNER TO aman;

--
-- Name: team; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.team (
    team_id integer NOT NULL,
    team_name text
);


ALTER TABLE public.team OWNER TO aman;

--
-- Name: umpire; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.umpire (
    umpire_id integer NOT NULL,
    umpire_name text,
    country_name text
);


ALTER TABLE public.umpire OWNER TO aman;

--
-- Name: umpire_match; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.umpire_match (
    umpirematch_key bigint NOT NULL,
    match_id integer,
    umpire_id integer,
    role_desc text,
    CONSTRAINT umpire_match_role_desc_check CHECK (((role_desc IS NOT NULL) AND ((role_desc = 'Field'::text) OR (role_desc = 'Third'::text))))
);


ALTER TABLE public.umpire_match OWNER TO aman;

--
-- Name: venue; Type: TABLE; Schema: public; Owner: aman
--

CREATE TABLE public.venue (
    venue_id integer NOT NULL,
    venue_name text,
    city_name text,
    country_name text,
    capacity integer
);


ALTER TABLE public.venue OWNER TO aman;

--
-- Name: ball_by_ball ball_by_ball_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.ball_by_ball
    ADD CONSTRAINT ball_by_ball_pkey PRIMARY KEY (match_id, innings_no, over_id, ball_id);


--
-- Name: match match_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_pkey PRIMARY KEY (match_id);


--
-- Name: owner owner_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.owner
    ADD CONSTRAINT owner_pkey PRIMARY KEY (owner_id);


--
-- Name: player_match player_match_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.player_match
    ADD CONSTRAINT player_match_pkey PRIMARY KEY (playermatch_key);


--
-- Name: player player_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_pkey PRIMARY KEY (player_id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (team_id);


--
-- Name: umpire_match umpire_match_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.umpire_match
    ADD CONSTRAINT umpire_match_pkey PRIMARY KEY (umpirematch_key);


--
-- Name: umpire umpire_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.umpire
    ADD CONSTRAINT umpire_pkey PRIMARY KEY (umpire_id);


--
-- Name: venue venue_pkey; Type: CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.venue
    ADD CONSTRAINT venue_pkey PRIMARY KEY (venue_id);


--
-- Name: match check_attendance_trigger; Type: TRIGGER; Schema: public; Owner: aman
--

CREATE TRIGGER check_attendance_trigger BEFORE INSERT OR UPDATE ON public.match FOR EACH ROW EXECUTE FUNCTION public.check_attendance();


--
-- Name: owner check_stake_trigger; Type: TRIGGER; Schema: public; Owner: aman
--

CREATE TRIGGER check_stake_trigger BEFORE INSERT OR UPDATE ON public.owner FOR EACH ROW EXECUTE FUNCTION public.check_stake();


--
-- Name: umpire_match check_umpires_trigger; Type: TRIGGER; Schema: public; Owner: aman
--

CREATE TRIGGER check_umpires_trigger BEFORE INSERT OR UPDATE ON public.umpire_match FOR EACH ROW EXECUTE FUNCTION public.check_umpires();


--
-- Name: ball_by_ball ball_by_ball_bowler_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.ball_by_ball
    ADD CONSTRAINT ball_by_ball_bowler_fkey FOREIGN KEY (bowler) REFERENCES public.player(player_id) ON DELETE SET NULL;


--
-- Name: ball_by_ball ball_by_ball_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.ball_by_ball
    ADD CONSTRAINT ball_by_ball_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.match(match_id) ON DELETE SET NULL;


--
-- Name: ball_by_ball ball_by_ball_non_striker_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.ball_by_ball
    ADD CONSTRAINT ball_by_ball_non_striker_fkey FOREIGN KEY (non_striker) REFERENCES public.player(player_id) ON DELETE SET NULL;


--
-- Name: ball_by_ball ball_by_ball_striker_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.ball_by_ball
    ADD CONSTRAINT ball_by_ball_striker_fkey FOREIGN KEY (striker) REFERENCES public.player(player_id) ON DELETE SET NULL;


--
-- Name: match match_man_of_match_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_man_of_match_fkey FOREIGN KEY (man_of_match) REFERENCES public.player(player_id) ON DELETE SET NULL;


--
-- Name: match match_match_winner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_match_winner_fkey FOREIGN KEY (match_winner) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: match match_team1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_team1_fkey FOREIGN KEY (team1) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: match match_team2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_team2_fkey FOREIGN KEY (team2) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: match match_toss_winner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_toss_winner_fkey FOREIGN KEY (toss_winner) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: match match_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venue(venue_id) ON DELETE SET NULL;


--
-- Name: owner owner_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.owner
    ADD CONSTRAINT owner_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: player_match player_match_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.player_match
    ADD CONSTRAINT player_match_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.match(match_id) ON DELETE SET NULL;


--
-- Name: player_match player_match_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.player_match
    ADD CONSTRAINT player_match_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player(player_id) ON DELETE SET NULL;


--
-- Name: player_match player_match_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.player_match
    ADD CONSTRAINT player_match_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id) ON DELETE SET NULL;


--
-- Name: umpire_match umpire_match_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.umpire_match
    ADD CONSTRAINT umpire_match_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.match(match_id) ON DELETE SET NULL;


--
-- Name: umpire_match umpire_match_umpire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aman
--

ALTER TABLE ONLY public.umpire_match
    ADD CONSTRAINT umpire_match_umpire_id_fkey FOREIGN KEY (umpire_id) REFERENCES public.umpire(umpire_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--
