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

test('laptop match fills remaining screen height and reveals are side-by-side, not stacked',()=>{
 assert.ok(css.includes('height:100dvh;'), 'main match shell must be viewport height');
 assert.ok(css.includes('#play:not(.hidden){'), 'active match must flex to fill screen');
 assert.ok(css.includes('#play .gamegrid{\n    flex:1 1 auto;'), 'match content must fill unused vertical area');
 assert.ok(css.includes('#play .gamecard:not(.hidden){\n    display:flex;'), 'question card must expand into remaining space');
 assert.ok(css.includes('#play .reveal:not(.hidden){\n    display:grid;'), 'goal reveal must use two-column grid');
 assert.ok(css.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr);'), 'goal vs details columns');
 assert.ok(css.includes('#play .reveal .outcome-stage{\n    grid-column:1;'), 'goal scene must be on the left');
 assert.ok(css.includes('#play .reveal .actions{\n    grid-column:2;'), 'next attack must remain on the right');
 assert.ok(css.includes('max-height:min(110px,14dvh)'), 'expanded answer bank should scroll internally');
});
