import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPlayerHistories,fullCareerQuestionEligible} from '../src/lib/pl-careers.js';
const load=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const arsenal=load('data/premier-league/player-seasons/1992-1993/arsenal.json');
const united=load('data/premier-league/player-seasons/1992-1993/manchester-united.json');
const bank=load('data/curated-bank.json');
test('historical appearances produce a per-player profile with source-traceable club seasons',()=>{
 const {byPlayer,reviewedClubSeasons}=buildPlayerHistories([arsenal,united]);
 assert.equal(reviewedClubSeasons.size,2);
 const cantona=byPlayer.get('player_eric_cantona');
 assert.equal(cantona.name,'Eric Cantona');
 assert.equal(cantona.seasons.length,1);
 assert.equal(cantona.totalRecordedAppearances,22);
 assert.equal(cantona.totalRecordedGoals,9);
 assert.equal(cantona.seasons[0].club,'Manchester United');
 assert.equal(cantona.seasons[0].sourceIds.length,2);
 assert.match(cantona.coverageNote,/not necessarily the full career/);
 const groves=byPlayer.get('player_perry_groves');
 assert.equal(groves.totalRecordedAppearances,1);
 assert.equal(groves.seasons[0].starts,0);
 assert.equal(groves.seasons[0].substituteAppearances,1);
});
test('transfers between Premier League clubs can form separate verified stints in a season',()=>{
 const transferred=structuredClone(arsenal.players[0]);
 const base=structuredClone(arsenal);
 const other=structuredClone(united);
 const same={...transferred,name:'Test Player',entityId:'player_test_transfer'};
 base.players=[same];
 other.players=[{...same,starts:0,substituteAppearances:1,appearances:1,goals:0}];
 const h=buildPlayerHistories([base,other]).byPlayer.get(same.entityId);
 assert.equal(h.seasons.length,2);
 assert.equal(h.clubs.length,2);
 assert.equal(h.totalRecordedAppearances,same.appearances+1);
});
test('full-career Football Connections stay blocked until all seasons are covered',()=>{
 const reviewed=buildPlayerHistories([arsenal,united]).reviewedClubSeasons;
 const membership=bank.facts.filter(f=>/^pl_season_\d{4}_\d{4}$/.test(f.relation)).map(f=>{
  const parts=f.relation.match(/^pl_season_(\d{4})_(\d{4})$/);
  return {season:parts[1]+'-'+parts[2],clubId:f.entityId};
 });
 assert.equal(fullCareerQuestionEligible(membership,reviewed,['club_arsenal','club_manchester_united']),false);
 assert.equal(fullCareerQuestionEligible(membership,reviewed,['club_real_madrid','club_arsenal']),false);
 const artificial=[{season:'1992-1993',clubId:'club_arsenal'},{season:'1992-1993',clubId:'club_manchester_united'}];
 assert.equal(fullCareerQuestionEligible(artificial,reviewed,['club_arsenal','club_manchester_united']),true);
});
