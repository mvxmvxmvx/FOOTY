// V14 reviewed answer-set materializer. SERVER-SIDE ONLY; not connected to V13 gameplay.
// Evidence can exist in the global archive without ever becoming a playable answer.
import {createHash} from 'node:crypto';
import {eligibleClubAppearances,eligibleTransferArrivals} from './eligibility.js';
import {scoreRarity} from './rarity.js';

const ID=/^[a-z][a-z0-9_.:-]{3,120}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const validDate=(x)=>typeof x==='string'&&DATE.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&
 new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const cleanById=(o)=>o && typeof o==='object' && !Array.isArray(o);

// This produces a DRAFT, not a publication. Call only with server-owned review
// records; never accept coverage, scores or source approval flags from browser input.
export function materializeReviewedAnswers({
 questionId,questionVersion,kind,filters,records,coverage,rarityByPlayer={},publishDate
}={}){
 if(!ID.test(questionId??'')||!ID.test(questionVersion??'')||
    !['club_appearance','transfer_arrival'].includes(kind)||
    !validDate(publishDate)||!cleanById(filters)||!Array.isArray(records)||
    !cleanById(rarityByPlayer)) throw Error('Invalid answer-set configuration');
 // Prevent future match or transfer evidence from entering a question published
 // before that evidence could have existed. A reviewed dataset is not a time machine.
 if(kind==='club_appearance'&&(!validDate(filters.asOf)||filters.asOf>publishDate))
  throw Error('Appearance question cutoff cannot be after publication');
 if(kind==='transfer_arrival'&&(!validDate(filters.windowEnd)||filters.windowEnd>publishDate))
  throw Error('Transfer window cutoff cannot be after publication');
 if(coverage?.status!=='reviewed_complete'||!ID.test(coverage.reviewId??'')||
    !validDate(coverage.reviewedAt)||coverage.reviewedAt>publishDate)
  throw Error('Complete documented coverage review required before materializing an open-ended question');

 const eligible=kind==='club_appearance'?
  eligibleClubAppearances(filters,records):
  eligibleTransferArrivals({...filters,coverageReviewed:true},records);
 if(eligible.length<2)throw Error('Question requires at least two reviewed, eligible answers');
 const answers=eligible.map(person=>{
  const entry=rarityByPlayer[person.player_id];
  if(!cleanById(entry))throw Error('Missing rarity inputs for '+person.player_id);
  if(entry.community!==undefined&&entry.community!==null){
   if(entry.community.questionVersion!==questionVersion)
    throw Error('Wrong question version in community rarity sample');
   if(!validDate(entry.community.snapshotDate)||entry.community.snapshotDate>=publishDate)
    throw Error('Community score must use a strictly earlier, dated snapshot');
  }
  const score=scoreRarity({eligible:true,
   editorialPoints:entry.editorialPoints??null,community:entry.community??null});
  if(score.points===null)throw Error('Unscored approved answer: '+person.player_id);
  return {playerId:person.player_id,name:person.player_label,
   points:score.points,tier:score.tier,scoreBasis:score.basis,
   sampleSize:score.sampleSize,sourceUrl:person.source_url};
 }).sort((a,b)=>a.playerId.localeCompare(b.playerId,'en'));
 const payload={
  questionId,questionVersion,kind,publishDate,coverageReviewId:coverage.reviewId,
  filters:{...filters},answers
 };
 // Integrity checksum is for change detection, NOT an authentication signature.
 const revision=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 return { ...payload,revision,status:'draft_reviewed_not_published' };
}
