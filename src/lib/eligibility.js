// FOOTY question-specific eligibility gate (V14 prototype).
// Research claims are retained in the database but NEVER become eligible just
// because a row matches a club name or lacks a departure date.
const ID=/^club_[a-z0-9_]+$/;
const SNAPSHOT=/^epl_20[0-9]{2}_[0-9]{2}_[a-z0-9_]+$/;
export function eligibleClubAppearances({clubId,snapshotId,asOf},records){
 if(!ID.test(clubId??'')||!SNAPSHOT.test(snapshotId??'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(asOf??'')||!Array.isArray(records))
  throw Error('Invalid appearance question filters');
 const players=new Map();
 for(const e of records){
  if(e.club_id!==clubId||e.snapshot_id!==snapshotId||
     e.review_status!=='reviewed'||e.evidence_type!=='competitive_appearance'||
     !/^player_[a-z0-9_]+$/.test(e.player_id??'')||
     !Number.isInteger(e.appearances)||e.appearances<1||
     typeof e.evidence_date!=='string'||e.evidence_date>asOf)continue;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.evidence_date))continue;
  if(!players.has(e.player_id))players.set(e.player_id,{player_id:e.player_id,
   player_label:e.player_label,source_url:e.source_url});
 }
 return [...players.values()];
}
export function eligibleTransferArrivals({snapshotId,toClubId,window,coverageReviewed},records){
 if(!SNAPSHOT.test(snapshotId??'')||!ID.test(toClubId??'')||
    !['summer_2026','winter_2027'].includes(window)||!Array.isArray(records))
  throw Error('Invalid transfer question filters');
 if(coverageReviewed!==true) return []; // no open-ended question on incomplete answers
 const found=new Map();
 for(const r of records){
  if(r.snapshot_id!==snapshotId||r.to_club_id!==toClubId||
     r.transfer_window!==window||r.review_status!=='reviewed'||
     !/^player_[a-z0-9_]+$/.test(r.player_id??'')||!r.announced_on)continue;
  if(!found.has(r.player_id))found.set(r.player_id,{player_id:r.player_id,
   player_label:r.player_label,source_url:r.source_url});
 }
 return [...found.values()];
}
