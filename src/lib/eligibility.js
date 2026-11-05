// FOOTY question-specific eligibility gate (V14 prototype).
// Research claims are retained in the database but NEVER become eligible just
// because a row matches a club name or lacks a departure date.
const ID=/^club_[a-z0-9_]+$/;
const SNAPSHOT=/^epl_20[0-9]{2}_[0-9]{2}_[a-z0-9_]+$/;
export function eligibleClubAppearances({clubId,snapshotId,seasonStart,asOf,competitionKey,teamLevel},records){
 if(!ID.test(clubId??'')||!SNAPSHOT.test(snapshotId??'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(asOf??'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(seasonStart??'')||seasonStart>asOf||
    !/^[_a-z0-9]+$/.test(competitionKey??'')||
    !['mens_first_team','womens_first_team'].includes(teamLevel)||
    !Array.isArray(records))
  throw Error('Invalid appearance question filters');
 const players=new Map();
 for(const e of records){
  if(e.club_id!==clubId||e.snapshot_id!==snapshotId||
     e.review_status!=='reviewed'||e.evidence_type!=='competitive_appearance'||
     !/^player_[a-z0-9_]+$/.test(e.player_id??'')||
     !Number.isInteger(e.appearances)||e.appearances<1||
     typeof e.evidence_date!=='string'||e.evidence_date<seasonStart||e.evidence_date>asOf||
     e.raw_evidence?.competition_key!==competitionKey||
     e.raw_evidence?.team_level!==teamLevel)continue;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.evidence_date))continue;
  if(!players.has(e.player_id))players.set(e.player_id,{player_id:e.player_id,
   player_label:e.player_label,source_url:e.source_url});
 }
 return [...players.values()];
}
export function eligibleTransferArrivals({snapshotId,toClubId,window,windowStart,windowEnd,coverageReviewed,dealTypes=['permanent','loan','free']},records){
 if(!SNAPSHOT.test(snapshotId??'')||!ID.test(toClubId??'')||
    !['summer_2026','winter_2027'].includes(window)||
    !/^\d{4}-\d{2}-\d{2}$/.test(windowStart??'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(windowEnd??'')||windowStart>windowEnd||
    !Array.isArray(records)||!Array.isArray(dealTypes)||dealTypes.length===0||
    dealTypes.some(x=>!['permanent','loan','loan_return','free','unknown'].includes(x))||
    new Set(dealTypes).size!==dealTypes.length)
  throw Error('Invalid transfer question filters');
 if(coverageReviewed!==true) return []; // no open-ended question on incomplete answers
 const found=new Map();
 for(const r of records){
  if(r.snapshot_id!==snapshotId||r.to_club_id!==toClubId||
     r.transfer_window!==window||!dealTypes.includes(r.deal_type)||
     r.review_status!=='reviewed'||
     !/^player_[a-z0-9_]+$/.test(r.player_id??'')||
     typeof r.announced_on!=='string'||r.announced_on<windowStart||r.announced_on>windowEnd)continue;
  if(!found.has(r.player_id))found.set(r.player_id,{player_id:r.player_id,
   player_label:r.player_label,source_url:r.source_url});
 }
 return [...found.values()];
}
