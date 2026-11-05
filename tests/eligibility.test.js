import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleClubAppearances,eligibleTransferArrivals} from '../src/lib/eligibility.js';
const q={clubId:'club_arsenal',snapshotId:'epl_2026_27_prejan_20261104',asOf:'2026-11-04'};
const base={club_id:q.clubId,snapshot_id:q.snapshotId,player_id:'player_example',
 player_label:'Example Player',source_url:'https://example.org/fact',review_status:'reviewed',
 evidence_type:'competitive_appearance',appearances:1,evidence_date:'2026-10-01'};
test('one verified senior competitive appearance qualifies; duplicates collapse',()=>{
 assert.deepEqual(eligibleClubAppearances(q,[base,{...base,appearances:2}]).map(x=>x.player_id),['player_example']);
});
test('Wikidata membership, youth/registration and wrong club do not qualify',()=>{
 const records=[
  {...base,evidence_type:'wikidata_membership'},
  {...base,evidence_type:'registration'},
  {...base,review_status:'pending'},
  {...base,evidence_date:'2027-01-01'},
  {...base,appearances:0},
  {...base,club_id:'club_chelsea'},
  {...base,player_id:null}
 ];
 assert.deepEqual(eligibleClubAppearances(q,records),[]);
});
test('open-ended summer arrival answer set requires completed and reviewed coverage',()=>{
 const arrival={snapshot_id:q.snapshotId,to_club_id:q.clubId,transfer_window:'summer_2026',
 review_status:'reviewed',player_id:'player_example',player_label:'Example Player',
 announced_on:'2026-08-20',source_url:'https://example.org/transfer'};
 const question={snapshotId:q.snapshotId,toClubId:q.clubId,window:'summer_2026',coverageReviewed:false};
 assert.deepEqual(eligibleTransferArrivals(question,[arrival]),[]);
 assert.equal(eligibleTransferArrivals({...question,coverageReviewed:true},[arrival]).length,1);
 assert.deepEqual(eligibleTransferArrivals({...question,coverageReviewed:true},[{...arrival,review_status:'pending'}]),[]);
});
