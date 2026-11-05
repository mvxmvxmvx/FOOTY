import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregatePriorRarity} from '../src/lib/rarity-aggregate.js';
import {scoreRarity} from '../src/lib/rarity.js';

const version='arsenal_2627:v1';
const params={questionVersion:version,snapshotDate:'2026-11-03',
 eligibleAnswerIds:['player_early','player_late']};
const event=(userId,answerId,overrides={})=>({
 userId,answerId,questionVersion:version,
 gameMode:'daily',actorType:'human',serverAccepted:true,serverVerified:true,
 acceptedAt:'2026-11-02T18:10:11Z',...overrides
});
test('deduplicates same account-answer pair without suppressing another valid answer',()=>{
 const a=aggregatePriorRarity({...params,events:[
  event('user_alex','player_early'),event('user_alex','player_early'),
  event('user_alex','player_late'),event('user_blair','player_late')
 ]});
 assert.equal(a.acceptedTotal,3);
 assert.equal(a.distinctParticipants,2);
 assert.equal(a.excludedEvents,1);
 assert.equal(a.communityByAnswer.player_early.answerPicks,1);
 assert.equal(a.communityByAnswer.player_late.answerPicks,2);
 assert.equal(JSON.stringify(a).includes('user_alex'),false);
});
test('rejects bots, practice, non-server-verified and future submissions',()=>{
 const events=[
  event('user_good','player_early'),
  event('user_bot','player_early',{actorType:'bot'}),
  event('user_staff','player_early',{actorType:'staff'}),
  event('user_practice','player_early',{gameMode:'practice'}),
  event('user_unverified','player_early',{serverVerified:false}),
  event('user_wrong','player_unknown'),
  event('user_future','player_early',{acceptedAt:'2026-11-04T00:00:00Z'}),
  event('user_other','player_late',{questionVersion:'another:v1'}),
  event('user_bad_date','player_late',{acceptedAt:'2026-02-30T18:10:11Z'})
 ];
 const a=aggregatePriorRarity({...params,events});
 assert.equal(a.acceptedTotal,1);
 assert.equal(a.distinctParticipants,1);
 assert.equal(a.excludedEvents,8);
});
test('empty cohort has no fabricated observed rarity and yields provisional scoring',()=>{
 const a=aggregatePriorRarity({...params,events:[]});
 assert.equal(a.communityByAnswer.player_early.answerPicks,0);
 assert.equal(a.communityByAnswer.player_early.acceptedTotal,0);
 const score=scoreRarity({eligible:true,
  community:a.communityByAnswer.player_early,editorialPoints:60});
 assert.equal(score.points,60);
 assert.equal(score.basis,'editorial_provisional');
});
test('valid sample can drive the frozen score snapshot on the correct version',()=>{
 const events=Array.from({length:500},(_,i)=>event('user_'+i.toString().padStart(5,'0'),
  i<5?'player_early':'player_late'));
 const a=aggregatePriorRarity({...params,events});
 assert.equal(a.acceptedTotal,500);
 assert.equal(a.distinctParticipants,500);
 const rare=scoreRarity({eligible:true,community:a.communityByAnswer.player_early});
 assert.equal(rare.points,85);
 assert.equal(rare.questionVersion,version);
 assert.equal(rare.snapshotDate,'2026-11-03');
});
test('rejects malformed configurations, duplicate answer IDs and calendar dates',()=>{
 assert.throws(()=>aggregatePriorRarity({...params,eligibleAnswerIds:['player_early','player_early'],events:[]}),/Invalid rarity/);
 assert.throws(()=>aggregatePriorRarity({...params,snapshotDate:'2026-02-30',events:[]}),/Invalid rarity/);
 assert.throws(()=>aggregatePriorRarity({...params,events:'invalid'}),/Invalid rarity/);
});
