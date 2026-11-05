import test from 'node:test';
import assert from 'node:assert/strict';
import {unresolvedTeamQids,buildTeamReviewCandidates} from '../src/lib/team-candidates.js';
const snak = id => ({snaktype:'value',datavalue:{value:{id}}});
const claims=[
 {club_id:null,club_external_id:'Q47774',player_external_id:'Q45901',raw_claim:{references:[{hash:'x'}]}},
 {club_id:null,club_external_id:'Q99',player_external_id:'Q43913',raw_claim:{qualifiers:{P2094:[snak('Q599867')]}}},
 {club_id:null,club_external_id:'Q99',player_external_id:'Q43913',raw_claim:{}},
 {club_id:'club_arsenal',club_external_id:'Q9617',player_external_id:'Q45901',raw_claim:{}}
];
test('unresolved QIDs are deduplicated and mapped clubs excluded',()=>{
 assert.deepEqual(unresolvedTeamQids(claims),['Q99','Q47774']);
});
test('Wikidata labels remain pending editorial candidates',()=>{
 const labels={entities:{Q99:{labels:{en:{value:'Test youth'}}},Q47774:{labels:{en:{value:'France'}}}}};
 const got=buildTeamReviewCandidates(claims,labels,{nationalTeams:{Q47774:'France national football team'}});
 assert.equal(got.length,2);
 assert.equal(got[0].classification_hint,'youth');
 assert.equal(got[0].observed_statements,2);
 assert.equal(got[1].classification_hint,'national_team');
 assert.equal(got[1].source_reference_statements,1);
 assert.ok(got.every(c=>c.review_status==='pending' && c.suggested_footy_club_id===null));
});
test('missing English labels stay null for manual review',()=>{
 const got=buildTeamReviewCandidates(claims,{entities:{}},{});
 assert.equal(got[0].label,null);
 assert.equal(got[1].classification_hint,'needs_review');
});
