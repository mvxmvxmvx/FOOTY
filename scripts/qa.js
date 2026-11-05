import fs from 'node:fs';import {compile,verify} from '../src/lib/questions.js';
const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const questions=compile(bank);
let checked=0;for(const q of questions){for(const a of q.answers){if(verify(q,a.name).status!=='accepted')throw Error(q.id+' '+a.name);checked++;}}
console.log(JSON.stringify({questions:questions.length,canonicalAnswersChecked:checked,entities:bank.entities.length,facts:bank.facts.length},null,2));
