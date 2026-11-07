import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,verify} from '../src/lib/questions.js';

const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const compiled=compile(bank);
const byId=new Map(compiled.map(q=>[q.id,q]));
const additions=[
 ['q_ucl_final_2008_united','Wayne Rooney','Ryan Giggs'],
 ['q_ucl_final_2008_chelsea','Michael Essien','Nicolas Anelka'],
 ['q_ucl_final_2014_madrid','Fábio Coentrão','Marcelo'],
 ['q_ucl_final_2014_atletico','Diego Godín','Antoine Griezmann'],
 ['q_ucl_final_2024_dortmund','Julian Ryerson','Marco Reus'],
 ['q_ucl_final_2024_madrid','Jude Bellingham','Luka Modrić'],
 ['q_ucl_final_2025_psg','Willian Pacho','Bradley Barcola'],
 ['q_ucl_final_2025_inter','Federico Dimarco','Piotr Zieliński']
];
test('eight new Champions League final starting-XI banks have exactly eleven source-traceable starters',()=>{
 for(const [id,starter,substitute] of additions){
  const q=byId.get(id);
  assert.ok(q,id);
  assert.equal(q.answers.length,11,id+' XI size');
  assert.equal(q.confidence,'reviewed',id);
  assert.equal(q.allOf.length,1,id);
  for(const source of q.sources)assert.ok(bank.sources[source],id+' source');
  assert.equal(verify(q,starter).status,'accepted',id+' starter '+starter);
  assert.equal(verify(q,substitute).status,'not_applicable',id+' nonstarter '+substitute);
 }
});
test('cross-final connection questions use only players who started both',()=>{
 const cases=[
  ['q_ucl_chelsea_2008_2012',['Petr Čech','Ashley Cole','Frank Lampard','Didier Drogba'],'Michael Ballack'],
  ['q_ucl_madrid_2014_2017',['Dani Carvajal','Raphaël Varane','Sergio Ramos','Luka Modrić','Karim Benzema','Cristiano Ronaldo'],'Gareth Bale'],
  ['q_ucl_madrid_2017_2024',['Dani Carvajal','Toni Kroos'],'Luka Modrić']
 ];
 for(const [id,answers,notInBoth] of cases){
  const q=byId.get(id);assert.ok(q,id);
  assert.equal(q.answers.length,answers.length,id+' exact overlap');
  for(const answer of answers)assert.equal(verify(q,answer).status,'accepted',id+' '+answer);
  assert.equal(verify(q,notInBoth).status,'not_applicable',id+' '+notInBoth);
 }
});
test('new aliases accept standard spellings but preserve verified-only answers',()=>{
 const cases=[
  ['q_ucl_final_2024_madrid','Vini Jr','Vinícius Júnior'],
  ['q_ucl_final_2024_madrid','Rodrygo Goes','Rodrygo'],
  ['q_ucl_final_2025_psg','Desire Doue','Désiré Doué'],
  ['q_ucl_final_2025_psg','Joao Neves','João Neves'],
  ['q_ucl_final_2025_inter','Hakan Calhanoglu','Hakan Çalhanoğlu'],
  ['q_ucl_final_2014_atletico','Raul Garcia','Raúl García']
 ];
 for(const [id,alias,canonical] of cases){
  const result=verify(byId.get(id),alias);
  assert.equal(result.status,'accepted',id+' '+alias);
  assert.equal(result.canonical,canonical);
 }
});
