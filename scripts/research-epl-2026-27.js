// Read-only, rate-limited EPL 2026/27 player/club identity research.
// Generates JSON and SQL review artifacts. Never writes to Supabase.
import fs from 'node:fs/promises';
import path from 'node:path';
import {validateSnapshot,teamQidProposal,wdqsQuery,parseWdqsBatch,partitionSeasonCandidates,seasonStageSql} from '../src/lib/epl-season.js';
const flags=Object.fromEntries(process.argv.slice(2).filter(a=>a.startsWith('--')&&a.includes('=')).map(a=>a.slice(2).split(/=(.*)/s).slice(0,2)));
const mode=flags.mode||'discover_teams';
if(!['discover_teams','discover_players'].includes(mode))throw Error('Use --mode=discover_teams or --mode=discover_players');
const config=validateSnapshot(JSON.parse(await fs.readFile(new URL('../data/seasons/epl-2026-27-prejanuary.json',import.meta.url),'utf8')));
const outputDir=flags.out||'data/staging/epl-2026-27';
if(path.isAbsolute(outputDir)||outputDir.includes('..'))throw Error('Output directory must be a relative safe path');
await fs.mkdir(outputDir,{recursive:true});
const agent='FOOTY-football-knowledge/0.1 (https://github.com/mvxmvxmvx/FOOTY; contact via GitHub Issues)';
async function getJson(url,accept){
 const resp=await fetch(url,{headers:{Accept:accept,'Accept-Encoding':'gzip, deflate','User-Agent':agent},signal:AbortSignal.timeout(25000)});
 if([429,503].includes(resp.status))throw Error('Provider busy/rate-limited ('+resp.status+'); stop and respect Retry-After '+(resp.headers.get('Retry-After')||'unspecified'));
 if(!resp.ok)throw Error('Provider returned HTTP '+resp.status);
 const json=await resp.json();if(json.error)throw Error('Provider returned error '+JSON.stringify(json.error));
 return json;
}
if(mode==='discover_teams'){
 const output={snapshot_id:config.id,as_of:config.asOf,generated_at:new Date().toISOString(),
  provider:'Wikidata Action API',status:'human_review_required',clubs:[]};
 for(const club of config.clubs){
  if(club.wikidataQid){output.clubs.push({club_id:club.id,club_name:club.name,confirmed_qid:club.wikidataQid,status:'already_verified'});continue;}
  const url=new URL('https://www.wikidata.org/w/api.php');
  for(const [k,v] of Object.entries({action:'wbsearchentities',search:club.name,language:'en',type:'item',limit:'5',format:'json',maxlag:'5'}))url.searchParams.set(k,v);
  const matches=await getJson(url,'application/json');
  output.clubs.push(teamQidProposal(matches,club));
  await new Promise(resolve=>setTimeout(resolve,300)); // one request at a time
 }
 const out=path.join(outputDir,'club-qid-candidates.json');
 await fs.writeFile(out,JSON.stringify(output,null,2)+'\n','utf8');
 console.log(JSON.stringify({mode,file:out,verified:config.clubs.filter(c=>c.wikidataQid).length,
  require_review:config.clubs.filter(c=>!c.wikidataQid).length,updated_supabase:false},null,2));
}else{
 const club=config.clubs.find(c=>c.id===flags.club);
 if(!club||!club.wikidataQid||club.qidStatus!=='verified')throw Error('Choose a currently mapped club ID; unresolved QIDs cannot produce claims');
 const limit=250,query=wdqsQuery(club.wikidataQid,'2026-07-01',config.asOf,limit);
 const url=new URL('https://query.wikidata.org/sparql');url.searchParams.set('format','json');url.searchParams.set('query',query);
 const response=await getJson(url,'application/sparql-results+json');
 const batch=parseWdqsBatch(response,club,config,limit);
 batch.manifest.generated_at=new Date().toISOString();
 const partitions=partitionSeasonCandidates(batch);
 const dataFile=path.join(outputDir,club.id+'-candidates.json');
 const reviewFile=path.join(outputDir,club.id+'-dated-review.json');
 const quarantineFile=path.join(outputDir,club.id+'-undated-quarantine.json');
 const sqlFile=path.join(outputDir,club.id+'-stage.sql');
 await fs.writeFile(dataFile,JSON.stringify(batch,null,2)+'\n','utf8');
 await fs.writeFile(reviewFile,JSON.stringify({manifest:{...batch.manifest,...partitions.audit},claims:partitions.dated},null,2)+'\n','utf8');
 await fs.writeFile(quarantineFile,JSON.stringify({manifest:{...batch.manifest,...partitions.audit},claims:partitions.undated},null,2)+'\n','utf8');
 await fs.writeFile(sqlFile,seasonStageSql({claims:partitions.dated}),'utf8');
 console.log(JSON.stringify({mode,club:club.id,claims:batch.manifest.candidate_rows,
  dated_review:partitions.dated.length,quarantined_undated:partitions.undated.length,
  truncated:batch.manifest.possibly_truncated,files:[dataFile,reviewFile,quarantineFile,sqlFile],
  IMPORTANT:'P54 claims are NOT proven current senior appearances. Only date-qualified records produce pending staging SQL. No Supabase writes.'},null,2));
}
