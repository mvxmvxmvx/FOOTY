import test from 'node:test';
import assert from 'node:assert/strict';
import {RARITY_TIERS,rarityTierFromShare,scoreRarity,MIN_COMMUNITY_SAMPLE} from '../src/lib/rarity.js';

const crowd=(answerPicks,acceptedTotal=1000)=>({answerPicks,acceptedTotal,snapshotDate:'2026-11-04',questionVersion:'played_for_arsenal:v1'});

test('preserves FOOTY existing 100/85/60/30/15/10 tiers',()=>{
 assert.deepEqual(RARITY_TIERS.map(x=>x.points),[100,85,60,30,15,10]);
 assert.equal(MIN_COMMUNITY_SAMPLE,500);
});
test('rate cutoffs are deterministic, inclusive and transparent',()=>{
 assert.equal(rarityTierFromShare(0.002).points,100);
 assert.equal(rarityTierFromShare(0.002001).points,85);
 assert.equal(rarityTierFromShare(0.01).points,85);
 assert.equal(rarityTierFromShare(0.03).points,60);
 assert.equal(rarityTierFromShare(0.10).points,30);
 assert.equal(rarityTierFromShare(0.25).points,15);
 assert.equal(rarityTierFromShare(1).points,10);
 assert.throws(()=>rarityTierFromShare(-0.1),/\[0,1\]/);
});
test('no unverified answer ever receives points',()=>{
 const result=scoreRarity({eligible:false,editorialPoints:100,community:crowd(0)});
 assert.equal(result.points,0);
 assert.equal(result.basis,'eligibility');
});
test('rare choices earn more but counts must belong to frozen question cohort',()=>{
 assert.equal(scoreRarity({eligible:true,community:crowd(2)}).points,100);
 assert.equal(scoreRarity({eligible:true,community:crowd(8)}).points,85);
 assert.equal(scoreRarity({eligible:true,community:crowd(25)}).points,60);
 assert.equal(scoreRarity({eligible:true,community:crowd(75)}).points,30);
 assert.equal(scoreRarity({eligible:true,community:crowd(200)}).points,15);
 assert.equal(scoreRarity({eligible:true,community:crowd(400)}).points,10);
 assert.equal(scoreRarity({eligible:true,community:crowd(8)}).basis,'community');
});
test('when crowd sample is small retain named, provisional editorial scores',()=>{
 const result=scoreRarity({eligible:true,community:crowd(1,100),editorialPoints:60});
 assert.equal(result.points,60);
 assert.equal(result.basis,'editorial_provisional');
 assert.equal(result.pickRate,null);
 assert.deepEqual(scoreRarity({eligible:true,community:crowd(1,10)}).points,null);
});
test('bad aggregates are rejected; live unsnapshotted crowd scores are not permitted',()=>{
 assert.throws(()=>scoreRarity({eligible:true,community:crowd(101,100)}),/Invalid community/);
 assert.throws(()=>scoreRarity({eligible:true,community:{answerPicks:5,acceptedTotal:1000}}),/dated/);
 assert.throws(()=>scoreRarity({eligible:true,community:{...crowd(2),questionVersion:''}}),/question-versioned/);
 assert.throws(()=>scoreRarity({eligible:true,editorialPoints:60,minimumSample:99}),/too low/);
});
