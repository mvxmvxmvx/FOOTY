import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../public/assets/game.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('matchday compact mode supports laptop, tablet, mobile and short displays',()=>{
 for(const query of ['@media (min-width: 901px)','@media (min-width:901px) and (max-height:780px)','@media (min-width:651px) and (max-width:900px)','@media (max-width:650px)']){
  assert.ok(css.includes(query),'missing '+query);
 }
 assert.ok(css.includes('body:has(#play:not(.hidden)) .wrap'));
 assert.ok(css.includes('#play .gamecard .answerrow{margin-top:9px}'));
 assert.ok(css.includes('#play .momentum-panel{max-width:none'));
 assert.ok(css.includes('#play .reveal .shot-scene{max-width:470px'));
});
test('responsive stylesheet keeps gameplay controls and celebration caption in DOM',()=>{
 for(const id of ['matchscoreboard','questionview','answer','submitanswer','skip','next','momentumpanel','shotscene']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes('class="goal-rarity hidden"'));
 assert.ok(css.includes('.goal-rarity{position:relative;inset:auto'));
 assert.ok(!css.includes('#play .gamecard{display:none'));
 assert.ok(!css.includes('#play .gamecard{overflow:hidden'));
});
