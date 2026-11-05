/* Reviewed short-answer defensive questions, v0.1.15.
   Four unambiguous options each; all answers are public football results.
   No dynamic distractor generation. No answer from this pool awards rarity. */
(function(root){
 'use strict';
 const QUESTIONS=Object.freeze([
 {id:'wc-2018',prompt:'Who won the 2018 World Cup?',answer:'France',options:['Croatia','France','Germany','Brazil']},
 {id:'wc-2014',prompt:'Who won the 2014 World Cup?',answer:'Germany',options:['Argentina','Netherlands','Germany','Spain']},
 {id:'wc-2022',prompt:'Who won the 2022 World Cup?',answer:'Argentina',options:['France','Argentina','Brazil','Portugal']},
 {id:'wc-2010',prompt:'Who won the 2010 World Cup?',answer:'Spain',options:['Netherlands','Germany','Italy','Spain']},
 {id:'wc-2006',prompt:'Who won the 2006 World Cup?',answer:'Italy',options:['France','Germany','Italy','Brazil']},
 {id:'wc-2002',prompt:'Who won the 2002 World Cup?',answer:'Brazil',options:['Brazil','Germany','France','Argentina']},
 {id:'ucl-2005',prompt:'Who won the 2005 Champions League final?',answer:'Liverpool',options:['AC Milan','Barcelona','Liverpool','Chelsea']},
 {id:'ucl-2012',prompt:'Who won the 2012 Champions League final?',answer:'Chelsea',options:['Bayern Munich','Chelsea','Real Madrid','Manchester United']},
 {id:'ucl-1999',prompt:'Who won the 1999 Champions League final?',answer:'Manchester United',options:['Bayern Munich','Juventus','Manchester United','Ajax']},
 {id:'euro-2016',prompt:'Who won UEFA Euro 2016?',answer:'Portugal',options:['France','Spain','Portugal','Italy']},
 {id:'euro-2024',prompt:'Who won UEFA Euro 2024?',answer:'Spain',options:['England','France','Germany','Spain']},
 {id:'invincibles',prompt:'Which club went unbeaten in the 2003–04 Premier League?',answer:'Arsenal',options:['Chelsea','Arsenal','Manchester United','Liverpool']}
 ]);
 function forRound(questionId,round){const seed=String(questionId||'')+'|'+String(round);let h=2166136261;for(const ch of seed){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return QUESTIONS[(h>>>0)%QUESTIONS.length]}
 function judge(question,choice){if(!question||!QUESTIONS.some(q=>q.id===question.id))throw new TypeError('Unknown counter question');return choice===question.answer?'saved':'conceded'}
 const api=Object.freeze({QUESTIONS,forRound,judge,DURATION_MS:5000});
 root.FOOTY_COUNTERS=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
