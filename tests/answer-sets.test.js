import test from 'node:test';
import assert from 'node:assert/strict';
import {materializeReviewedAnswers} from '../src/lib/answer-sets.js';
const question={
 questionId:'arsenal_league_2627',
 questionVersion:'arsenal_league_2627:v1',
 kind:'club_appearance',publishDate:'2026-11-04',
 coverage:{status:'reviewed_complete',reviewId:'coverage_arsenal_2627',reviewedAt:'2026-11-03'},
 filters:{clubId:'club_arsenal',snapshotId:'epl_2026_27_prejan_20261104',
  seasonStart:'2026-07-01',asOf:'2026-11-04',
  competitionKey:'english_premier_league',teamLevel:'mens_first_team'}
};
const record=(player_id,more={})=>({
 club_id:'club_arsenal',snapshot_id:'epl_2026_27_prejan_20261104',
 player_id,player_label:player_id,review_status:'reviewed',
 evidence_type:'competitive_appearance',appearances:1,evidence_date:'2026-10-01',
 raw_evidence:{competition_key:'english_premier_league',team_level:'mens_first_team'},
 source_url:'https://example.org/evidence/'+player_id,...more
});
const rarityByPlayer={
 player_alex:{editorialPoints:15},
 player_blair:{editorialPoints:85}
};
const records=[record('player_alex'),record('player_blair')];

test('two verified players generate a deterministic provisional answer-set draft',()=>{
 const a=materializeReviewedAnswers({...question,records,rarityByPlayer});
 const b=materializeReviewedAnswers({...question,records:[...records].reverse(),rarityByPlayer});
 assert.equal(a.status,'draft_reviewed_not_published');
 assert.equal(a.answers.length,2);
 assert.deepEqual(a.answers.map(x=>x.points),[15,85]);
 assert.deepEqual(a.answers.map(x=>x.scoreBasis),['editorial_provisional','editorial_provisional']);
 assert.equal(a.revision,b.revision);
 assert.match(a.revision,/^[0-9a-f]{64}$/);
});

test('membership-only, pending and wrong team evidence never becomes eligible',()=>{
 const bad=[record('player_alex',{evidence_type:'wikidata_membership'}),
  record('player_blair',{review_status:'pending'}),
  record('player_blair',{raw_evidence:{competition_key:'womens_super_league',team_level:'womens_first_team'}})];
 assert.throws(()=>materializeReviewedAnswers({...question,records:bad,rarityByPlayer}),/at least two reviewed/);
});

test('coverage review is mandatory even when two correct players are present',()=>{
 assert.throws(()=>materializeReviewedAnswers({...question,coverage:{status:'partial'},records,rarityByPlayer}),/Complete documented/);
 assert.throws(()=>materializeReviewedAnswers({...question,coverage:{...question.coverage,reviewedAt:'2026-11-05'},records,rarityByPlayer}),/Complete documented/);
});

test('rarity cannot be borrowed from another version or from the game day',()=>{
 const wrong={...rarityByPlayer,player_alex:{community:{answerPicks:2,acceptedTotal:1000,snapshotDate:'2026-11-03',questionVersion:'other:v1'}}};
 assert.throws(()=>materializeReviewedAnswers({...question,records,rarityByPlayer:wrong}),/Wrong question version/);
 const sameDay={...rarityByPlayer,player_alex:{community:{answerPicks:2,acceptedTotal:1000,snapshotDate:'2026-11-04',questionVersion:question.questionVersion}}};
 assert.throws(()=>materializeReviewedAnswers({...question,records,rarityByPlayer:sameDay}),/strictly earlier/);
 const proper={...rarityByPlayer,player_alex:{community:{answerPicks:2,acceptedTotal:1000,snapshotDate:'2026-11-03',questionVersion:question.questionVersion}}};
 const result=materializeReviewedAnswers({...question,records,rarityByPlayer:proper});
 assert.equal(result.answers[0].points,100);
 assert.equal(result.answers[0].scoreBasis,'community');
});

test('unscored approved answers block materialization rather than fabricating 100 points',()=>{
 assert.throws(()=>materializeReviewedAnswers({...question,records,rarityByPlayer:{player_alex:{editorialPoints:15},player_blair:{}}}),/Unscored approved/);
});

test('open-ended transfer arrivals require complete coverage and verified window match',()=>{
 const filters={snapshotId:'epl_2026_27_prejan_20261104',toClubId:'club_arsenal',
  window:'summer_2026',windowStart:'2026-06-15',windowEnd:'2026-09-01'};
 const rec=player_id=>({
  snapshot_id:filters.snapshotId,to_club_id:filters.toClubId,transfer_window:filters.window,
  review_status:'reviewed',player_id,player_label:player_id,source_url:'https://example.org/transfer',
  announced_on:'2026-08-21'
 });
 const result=materializeReviewedAnswers({...question,kind:'transfer_arrival',filters,
  records:[rec('player_alex'),rec('player_blair'),{...rec('player_poor'),announced_on:'2027-01-01'}],rarityByPlayer});
 assert.equal(result.answers.length,2);
});
