import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,verify} from '../src/lib/questions.js';
import {dailyPlan} from '../src/lib/daily.js';
const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const questions=compile(bank);
test('curated bank counts remain intact',()=>{
 assert.equal(bank.entities.length,561);assert.equal(bank.facts.length,1411);assert.equal(questions.length,77);
 assert.ok(questions.every(q=>q.answers.length>=2));
});
test('all canonical answers are accepted and irrelevant guesses rejected',()=>{
 for(const q of questions){
 for(const a of q.answers){const result=verify(q,a.name);assert.equal(result.status,'accepted',q.id+': '+a.name);}
 assert.equal(verify(q,'Spongebob Squarepants').status,'not_applicable',q.id);
 }});
test('spelling correction and source limits',()=>{
 const q=questions.find(q=>q.id==='q_played_premier_league');
 const result=verify(q,'Nottinham Forrest');assert.equal(result.status,'accepted');assert.equal(result.canonical,'Nottingham Forest');
});
test('daily plan is stable and seven questions',()=>{
 const one=dailyPlan(questions,'2026-11-04'),two=dailyPlan(questions,'2026-11-04');
 assert.deepEqual(one,two);assert.equal(one.questionIds.length,7);assert.equal(new Set(one.questionIds).size,7);
});
