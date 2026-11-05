// Prepare a human-review list of previously unmapped Wikidata P54 team QIDs.
// Never maps entities or publishes claims to gameplay.
import fs from 'node:fs/promises';
import path from 'node:path';
import {unresolvedTeamQids,buildTeamReviewCandidates} from '../src/lib/team-candidates.js';

const args=process.argv.slice(2);
const arg=(flag,fallback)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:fallback;};
if(args.includes('--help')){
 console.log('node scripts/resolve-wikidata-teams.js [--input data/staging/claims.json] [--fixture response.json] [--out data/staging/team-candidates.json]');
 process.exit(0);
}
const input=arg('--input','data/staging/claims.json');
const output=arg('--out','data/staging/team-candidates.json');
const mappings=JSON.parse(await fs.readFile(new URL('../data/external/wikidata-ids.json',import.meta.url),'utf8'));
const payload=JSON.parse(await fs.readFile(input,'utf8'));
if(!Array.isArray(payload.claims))throw Error('Invalid claims file');
const qids=unresolvedTeamQids(payload.claims);
if(qids.length>50)throw Error('Too many unmapped teams for one sample; split batches');
let entities;
if(qids.length===0)entities={entities:{}};
else if(arg('--fixture'))entities=JSON.parse(await fs.readFile(arg('--fixture'),'utf8'));
else{
 const url=new URL('https://www.wikidata.org/w/api.php');
 for(const [key,value] of Object.entries({
  action:'wbgetentities',ids:qids.join('|'),props:'labels|descriptions',languages:'en',
  format:'json',maxlag:'5'
 }))url.searchParams.set(key,value);
 const response=await fetch(url,{headers:{
  Accept:'application/json',
  'User-Agent':'FOOTY/14.0 (https://github.com/mvxmvxmvx/FOOTY; contact via GitHub Issues)'
 },signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Wikidata label API HTTP '+response.status+' — retry later, respect upstream rate limits');
 entities=await response.json();
 if(entities.error)throw Error('Wikidata error: '+JSON.stringify(entities.error));
}
const candidates=buildTeamReviewCandidates(payload.claims,entities,mappings);
const result={
 manifest:{
  reviewed:false,source:'Wikidata Action API label/description lookup',
  generatedAt:new Date().toISOString(),totalUnmappedTeams:qids.length,
  totalUnmappedStatements:payload.claims.filter(c=>c.club_id===null).length,
  caution:'Candidate labels are unverified. No club links were changed and no scored questions added.'
 },
 candidates
};
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({output,candidateTeams:qids.length,unmatchedWithoutEnglishLabel:candidates.filter(c=>!c.label).length,
 knownNationalTeams:candidates.filter(c=>c.classification_hint==='national_team').length,
 youthEntries:candidates.filter(c=>c.classification_hint==='youth').length},null,2));
