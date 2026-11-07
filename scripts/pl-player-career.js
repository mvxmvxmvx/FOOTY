// Run: node scripts/pl-player-career.js --player "Eric Cantona"
// Reports only audited Premier League appearance seasons. No guessed spells.
import fs from 'node:fs/promises';
import {buildPlayerHistories} from '../src/lib/pl-careers.js';
const dir=new URL('../data/premier-league/player-seasons/',import.meta.url);
const manifests=[];
for(const season of (await fs.readdir(dir,{withFileTypes:true})).filter(x=>x.isDirectory())){
 for(const file of (await fs.readdir(new URL(season.name+'/',dir))).filter(x=>x.endsWith('.json'))){
  manifests.push(JSON.parse(await fs.readFile(new URL(season.name+'/'+file,dir),'utf8')));
 }
}
const args=process.argv.slice(2),idx=args.indexOf('--player'),idIdx=args.indexOf('--id');
const query=idx>=0?args[idx+1]:null,id=idIdx>=0?args[idIdx+1]:null;
if(!query&&!id){console.log('Use --player "Eric Cantona" or --id player_eric_cantona');process.exit(1)}
const {byPlayer,reviewedClubSeasons}=buildPlayerHistories(manifests);
const candidates=[...byPlayer.values()].filter(p=>id?p.entityId===id:p.name.toLowerCase()===query.toLowerCase());
console.log(JSON.stringify({reviewedClubSeasons:reviewedClubSeasons.size,results:candidates,note:'Only reviewed Premier League club-seasons are included; unreviewed years are not absence claims.'},null,2));
