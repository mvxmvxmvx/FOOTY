// FOOTY rarity V14 — proposal/preview only. NOT wired to public scoring.
// Eligibility comes first and must be established by server-approved evidence.
// Community score uses an immutable aggregate from earlier rounds; never live client input.

export const RARITY_TIERS=Object.freeze([
  {maxShare:0.002,points:100,name:'ONE IN A MILLION'},
  {maxShare:0.01,points:85,name:'DEEP CUT'},
  {maxShare:0.03,points:60,name:'RARE'},
  {maxShare:0.10,points:30,name:'SOLID SHOUT'},
  {maxShare:0.25,points:15,name:'TECHNICALLY...'},
  {maxShare:1,points:10,name:'OBVIOUS!'}
]);
export const MIN_COMMUNITY_SAMPLE=500;
const editorial=new Set(RARITY_TIERS.map(x=>x.points));

export function rarityTierFromShare(share){
 if(typeof share!=='number'||!Number.isFinite(share)||share<0||share>1)throw Error('Rarity share must be in [0,1]');
 return RARITY_TIERS.find(t=>share<=t.maxShare);
}
export function scoreRarity({eligible,editorialPoints=null,community=null,minimumSample=MIN_COMMUNITY_SAMPLE}={}){
 if(eligible!==true) return {points:0,tier:'INELIGIBLE',basis:'eligibility',pickRate:null,sampleSize:0};
 if(!Number.isSafeInteger(minimumSample)||minimumSample<100)throw Error('Minimum sample too low');
 if(community!==null){
  if(!community||!Number.isSafeInteger(community.acceptedTotal)||
   !Number.isSafeInteger(community.answerPicks)||community.acceptedTotal<0||
   community.answerPicks<0||community.answerPicks>community.acceptedTotal)
   throw Error('Invalid community counts');
  if(community.acceptedTotal>=minimumSample){
   // A frozen aggregate and question-version scope are REQUIRED to prevent
   // players seeing different scores while a daily challenge is ongoing.
   if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(community.snapshotDate??'')||
      typeof community.questionVersion!=='string'||!community.questionVersion.trim())
    throw Error('Crowd rarity requires a dated, question-versioned snapshot');
   const share=community.answerPicks/community.acceptedTotal;
   const tier=rarityTierFromShare(share);
   return {points:tier.points,tier:tier.name,basis:'community',pickRate:share,
    sampleSize:community.acceptedTotal,snapshotDate:community.snapshotDate,
    questionVersion:community.questionVersion};
  }
 }
 if(editorial.has(editorialPoints)){
  const tier=RARITY_TIERS.find(t=>t.points===editorialPoints);
  return {points:tier.points,tier:tier.name,basis:'editorial_provisional',
    pickRate:null,sampleSize:community?.acceptedTotal??0};
 }
 // No crowd sample and no reviewed editorial score -> do not pretend a rarity.
 return {points:null,tier:'PENDING',basis:'insufficient_data',pickRate:null,
  sampleSize:community?.acceptedTotal??0};
}
