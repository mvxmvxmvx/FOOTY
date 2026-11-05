import test from 'node:test';
import assert from 'node:assert/strict';
import {qidFromSnak,timeQualifier,extractClaimRows,stagingSql} from '../src/lib/wikidata.js';
const snak=(id)=>({snaktype:'value',datavalue:{value:{id}}});
const time=(value,precision)=>({snaktype:'value',datavalue:{value:{time:value,precision}}});
const maps={players:{Q45901:'player_thierry_henry'},clubs:{Q9617:'club_arsenal'},nationalTeams:{Q47774:'France national football team'}};
const fixture={entities:{Q45901:{claims:{P54:[
 {id:'Q45901$test-1',rank:'normal',mainsnak:snak('Q9617'),qualifiers:{P580:[time('+1999-08-03T00:00:00Z',11)],P582:[time('+2007-00-00T00:00:00Z',9)]}},
 {id:'Q45901$test-2',rank:'normal',mainsnak:snak('Q9617'),qualifiers:{P580:[time('+2012-01-06T00:00:00Z',11)],P582:[time('+2012-02-15T00:00:00Z',11)],P1642:[snak('Q2914547')]}},
 {id:'Q45901$test-3',rank:'normal',mainsnak:snak('Q11111111'),qualifiers:{P580:[time('+2001-06-00T00:00:00Z',10)]}},
 {id:'Q45901$test-4',rank:'deprecated',mainsnak:snak('Q9617')},
 {id:'Q45901$test-5',rank:'normal',mainsnak:snak('Q9617'),qualifiers:{P2094:[snak('Q599867')]}},
 {id:'Q45901$test-6',rank:'normal',mainsnak:snak('Q47774'),qualifiers:{P580:[time('+1997-00-00T00:00:00Z',9)]}}
 ]}}}};
test('Wikidata item snaks require valid QIDs',()=>{
 assert.equal(qidFromSnak(snak('Q9617')),'Q9617');
 assert.equal(qidFromSnak(snak('invalid')),null);
 assert.equal(qidFromSnak({snaktype:'novalue'}),null);
});
test('time qualifiers retain precision instead of fabricating January dates',()=>{
 assert.deepEqual(timeQualifier({P580:[time('+2007-00-00T00:00:00Z',9)]},'P580'),{value:'2007',precision:'year'});
 assert.deepEqual(timeQualifier({P580:[time('+2001-06-00T00:00:00Z',10)]},'P580'),{value:'2001-06',precision:'month'});
 assert.deepEqual(timeQualifier({P580:[time('+2012-01-06T00:00:00Z',11)]},'P580'),{value:'2012-01-06',precision:'day'});
 assert.deepEqual(timeQualifier({P580:[time('-2012-01-06T00:00:00Z',11)]},'P580'),{value:null,precision:'unknown'});
});
test('P54 claims stay in review staging, preserve loan and unresolved teams',()=>{
 const claims=extractClaimRows(fixture,maps);assert.equal(claims.length,5);
 assert.equal(claims[0].player_id,'player_thierry_henry');
 assert.equal(claims[0].observed_from,'1999-08-03');assert.equal(claims[0].observed_to,'2007');
 assert.equal(claims[1].loan_flag,true);
 assert.equal(claims[2].club_id,null);assert.equal(claims[2].team_classification,'unknown');
 assert.equal(claims[2].observed_from,'2001-06');assert.equal(claims[2].from_precision,'month');
 assert.equal(claims[3].team_classification,'youth');assert.equal(claims[3].club_id,null);
 assert.equal(claims[4].team_classification,'national_team');assert.equal(claims[4].club_id,null);
 assert.ok(claims.every(c=>c.review_status==='pending'));
});
test('SQL exporter only inserts into staging and prevents accidental publication',()=>{
 const sql=stagingSql(extractClaimRows(fixture,maps));
 assert.match(sql,/insert into footy.external_career_claims/i);
 assert.match(sql,/on conflict\(claim_key\) do update/i);
 assert.match(sql,/raw_claim\s*=\s*coalesce/i);
 assert.doesNotMatch(sql,/insert into footy.question_templates/i);
 assert.doesNotMatch(sql,/2007-01-01/);
 assert.throws(()=>stagingSql([{player_external_id:'bad'}]),/Invalid claim/);
});
test('invalid API result is rejected',()=>assert.throws(()=>extractClaimRows({},maps),/Invalid Wikidata API payload/));
