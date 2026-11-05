// FOOTY V14 — privacy-minimal, offline aggregate for future community rarity.
// Input MUST be server-validated accepted-answer events, never raw client claims.
// No database writes, no live scoring changes, and no individual user IDs in output.
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const ID=/^[a-z][a-z0-9_.:-]{3,120}$/;
const timestamp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const validDay=(s)=>typeof s==='string'&&DATE.test(s)&&
 !Number.isNaN(Date.parse(s+'T00:00:00Z'))&&
 new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const validTimestamp=(s)=>typeof s==='string'&&timestamp.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s.slice(0,10);

// One account can vote for each distinct valid answer AT MOST once for this
// question version. Multiple accepted answers per account are permitted.
// The denominator is all distinct legitimate accepted answers, NOT users,
// impressions, invalid guesses, or database-record counts.
export function aggregatePriorRarity({
 events,questionVersion,snapshotDate,eligibleAnswerIds
}={}){
 if(!ID.test(questionVersion??'')||!validDay(snapshotDate)||
    !Array.isArray(events)||events.length>1000000||
    !Array.isArray(eligibleAnswerIds)||eligibleAnswerIds.length===0||
    eligibleAnswerIds.length>10000||eligibleAnswerIds.some(id=>!ID.test(id))||
    new Set(eligibleAnswerIds).size!==eligibleAnswerIds.length)
   throw Error('Invalid rarity aggregate inputs');
 const counts=new Map(eligibleAnswerIds.map(id=>[id,0]));
 const seenByAccount=new Map(),participants=new Set();
 let total=0,excluded=0;
 for(const event of events){
  if(!event || event.questionVersion!==questionVersion||
     event.gameMode!=='daily'||event.actorType!=='human'||
     event.serverAccepted!==true||event.serverVerified!==true||
     !ID.test(event.userId??'')||!counts.has(event.answerId)||
     !validTimestamp(event.acceptedAt)||
     event.acceptedAt.slice(0,10)>snapshotDate){
    excluded++;continue;
  }
  let seen=seenByAccount.get(event.userId);
  if(!seen){seen=new Set();seenByAccount.set(event.userId,seen);}
  if(seen.has(event.answerId)){excluded++;continue;}
  seen.add(event.answerId);
  participants.add(event.userId);
  counts.set(event.answerId,counts.get(event.answerId)+1);
  total++;
 }
 const communityByAnswer={};
 for(const [answerId,answerPicks] of counts){
  communityByAnswer[answerId]={
   answerPicks,acceptedTotal:total,snapshotDate,questionVersion
  };
 }
 return {
  questionVersion,snapshotDate,acceptedTotal:total,
  distinctParticipants:participants.size,excludedEvents:excluded,
  communityByAnswer,
  notes:'Daily, server-accepted, eligible and version-matched responses only. Distinct account-answer pairs; no user identifiers exported.'
 };
}
