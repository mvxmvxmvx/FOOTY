// Fetch a small, verified-QID Wikidata sample; generate review artifacts only.
// Nothing is written to Supabase and no questions are enabled.
import fs from 'node:fs/promises';
import path from 'node:path';
import {extractClaimRows,stagingSql} from '../src/lib/wikidata.js';

const args=process.argv.slice(2);
const flag=(key)=>{const i=args.indexOf(key);return i<0?null:args[i+1];};
if(args.includes('--help')){
  console.log('node scripts/fetch-wikidata.js [--fixture example-api-response.json] [--out data/staging/wikidata.json] [--sql-out data/staging/wikidata.sql]');
  process.exit(0);
}
const mappings=JSON.parse(await fs.readFile(new URL('../data/external/wikidata-ids.json',import.meta.url),'utf8'));
let payload;
if(flag('--fixture')){
  payload=JSON.parse(await fs.readFile(flag('--fixture'),'utf8'));
}else{
  // One intentionally bounded Action API call; do not scrape search results.
  const qids=Object.keys(mappings.players||{});
  if(!qids.length||qids.length>25||qids.some(q=>!/^Q[1-9][0-9]*$/.test(q)))throw Error('Invalid player QID sample');
  const url=new URL('https://www.wikidata.org/w/api.php');
  for(const [key,value] of Object.entries({
    action:'wbgetentities',ids:qids.join('|'),props:'claims',format:'json',maxlag:'5'
  }))url.searchParams.set(key,value);
  const response=await fetch(url,{
    headers:{
      Accept:'application/json',
      'Accept-Encoding':'gzip, deflate',
      'User-Agent':'FOOTY/14.0 (https://github.com/mvxmvxmvx/FOOTY; contact via GitHub Issues)'
    },
    signal:AbortSignal.timeout(25000)
  });
  if(response.status===429||response.status===503){
    throw Error('Wikidata rate-limited/busy ('+response.status+'). Stop; respect Retry-After: '+(response.headers.get('retry-after')||'unspecified'));
  }
  if(!response.ok)throw Error('Wikidata API failed: HTTP '+response.status);
  payload=await response.json();
  if(payload.error)throw Error('Wikidata API returned error: '+JSON.stringify(payload.error));
}
const claims=extractClaimRows(payload,mappings);
const extracted={
  manifest:{
    provider:'Wikidata',license:'CC0',retrievedAt:new Date().toISOString(),
    upstream:'https://www.wikidata.org/w/api.php',peopleRequested:Object.keys(mappings.players).length,
    statementCount:claims.length,unresolvedTeamCount:claims.filter(c=>!c.club_id).length,
    caution:'P54 is not an exhaustive career history. Stage only; no gameplay publication.'
  },
  claims
};
const output=flag('--out')||'data/staging/wikidata-career-claims.json';
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify(extracted,null,2)+'\n','utf8');
if(flag('--sql-out')){
 const sqlOut=flag('--sql-out');
 await fs.mkdir(path.dirname(sqlOut),{recursive:true});
 await fs.writeFile(sqlOut,stagingSql(claims),'utf8');
}
console.log(JSON.stringify({output,people:Object.keys(mappings.players).length,
 claims:claims.length,unresolved:extracted.manifest.unresolvedTeamCount,
 next:'Review the artifact, resolve QIDs, then stage in private Supabase. Scoring unchanged.'},null,2));
