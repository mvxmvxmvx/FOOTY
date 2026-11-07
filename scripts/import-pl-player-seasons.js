// Usage:
// node scripts/import-pl-player-seasons.js --manifest data/premier-league/player-seasons/1992-1993/arsenal.json
// node scripts/import-pl-player-seasons.js --manifest ... --write
// Dry run by default. The manifest is the permanent player-season audit trail.
import fs from 'node:fs/promises';
import {importClubSeason} from '../src/lib/pl-player-seasons.js';
const args=process.argv.slice(2),flag=n=>{const i=args.indexOf(n);return i<0?null:args[i+1];};
if(args.includes('--help')){
 console.log('node scripts/import-pl-player-seasons.js --manifest <relative JSON path> [--write]\nDry run unless --write is explicitly provided. Refuses incomplete or unreviewed rosters.');
 process.exit(0);
}
const manifestPath=flag('--manifest');
if(!manifestPath||!manifestPath.startsWith('data/premier-league/player-seasons/')||!manifestPath.endsWith('.json'))throw Error('Supply --manifest data/premier-league/player-seasons/<season>/<club>.json');
const repoRoot=new URL('../',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('../'+manifestPath,import.meta.url),'utf8'));
const bankPath=new URL('../data/curated-bank.json',import.meta.url);
const original=JSON.parse(await fs.readFile(bankPath,'utf8'));
const {bank,summary}=importClubSeason(original,manifest);
console.log(JSON.stringify({...summary,mode:args.includes('--write')?'WRITE':'DRY RUN',entities:bank.entities.length,facts:bank.facts.length,questions:bank.questions.length},null,2));
if(args.includes('--write'))await fs.writeFile(bankPath,JSON.stringify(bank,null,2)+'\n','utf8');
