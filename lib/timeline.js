import {selectTrainPair} from './planner.js';
export function clock(value,offset=0){
 const m=String(value||'').match(/(?:T|^)(\d\d):(\d\d)/);if(!m)return 'Unverified';
 const total=Number(m[1])*60+Number(m[2])+offset;
 const day=Math.floor(total/1440),n=((total%1440)+1440)%1440,h=Math.floor(n/60);
 return `${h%12||12}:${String(n%60).padStart(2,'0')}${h>=12?'pm':'am'}${day<0?' (previous day)':day>0?' (next day)':''}`;
}
export function makeTimeline({outboundLocal,inboundLocal,mode,children=0,adults=1,driveMinutes=null,rtd}){
 const family=children>0,airportBuffer=family?150:120,exit=family?75:60;
 const target=clock(outboundLocal,-airportBuffer),atGate=clock(outboundLocal,-60);
 const validDrive=Number.isFinite(Number(driveMinutes))&&Number(driveMinutes)>0&&Number(driveMinutes)<=300;
 const drive=validDrive?Number(driveMinutes):null;
 const train=mode==='rtd';
 const pair=rtd?.verified?selectTrainPair({outboundSchedule:rtd.outbound?.centralParkToDEN,returnSchedule:rtd.return?.denToCentralPark,outboundLocal,inboundLocal,travelers:family?'family':'solo'}):null;
 const outbound=[],inbound=[];
 if(train){
  outbound.push({action:'Leave home for Central Park',time:pair?.outbound&&drive?clock(pair.outbound.departCentralPark,-drive-30):'Check drive time',note:'30 minutes to park, unload and reach the platform.'});
  outbound.push({action:'Park and unload at Central Park',time:pair?.outbound?clock(pair.outbound.departCentralPark,-30):'Unverified',note:'Pay extended parking before boarding.'});
  outbound.push({action:'A Line departs Central Park',time:clock(pair?.outbound?.departCentralPark),note:'Published timetable'});
  outbound.push({action:'A Line arrives at DEN station',time:clock(pair?.outbound?.arriveDEN),note:'Allow 15 minutes to reach terminal.'});
 }else{
  outbound.push({action:mode==='parking'?'Leave home':'Ride pickup',time:drive?clock(outboundLocal,-airportBuffer-drive-(mode==='parking'?30:0)):'Check drive time',note:drive?'Uses your entered driving estimate; not live traffic.':'Provide a driving estimate to calculate this time.'});
  if(mode==='parking')outbound.push({action:'Park, unload and reach terminal',time:clock(outboundLocal,-airportBuffer-30),note:'30-minute parking transfer buffer.'});
 }
 outbound.push({action:'Inside terminal / check bags',time:target,note:`${airportBuffer/60} hours before flight; check-in and security duration may vary.`});
 outbound.push({action:'Lounge, if eligible',time:clock(outboundLocal,-120)+'–'+atGate,note:'One-hour goal, only if check-in and security allow.'});
 outbound.push({action:'At gate',time:atGate,note:'Confirm airline boarding and gate cutoff.'});
 outbound.push({action:'Flight departs',time:clock(outboundLocal),note:'Calendar flight time'});
 inbound.push({action:'Flight arrives at DEN',time:clock(inboundLocal),note:'Calendar flight time'});
 inbound.push({action:'Deplane, collect bags and stroller',time:clock(inboundLocal)+'–'+clock(inboundLocal,family?60:45),note:'Estimated allowance, not guaranteed.'});
 if(train){
  inbound.push({action:'Reach DEN rail platform',time:clock(inboundLocal,exit),note:'Includes station walk.'});
  inbound.push({action:'A Line departs DEN',time:clock(pair?.inbound?.departDEN),note:'Published timetable; take a later train if bags are delayed.'});
  inbound.push({action:'A Line arrives at Central Park',time:clock(pair?.inbound?.arriveCentralPark),note:'Published timetable'});
  inbound.push({action:'Load car / reinstall car seats',time:pair?.inbound?clock(pair.inbound.arriveCentralPark,20):'Unverified',note:'20-minute loading allowance.'});
  inbound.push({action:'Arrive home',time:pair?.inbound&&drive?clock(pair.inbound.arriveCentralPark,20+drive):'Check drive time',note:'Uses your entered driving estimate.'});
 }else{
  inbound.push({action:mode==='parking'?'Shuttle to car / leave DEN':'Request ride after baggage claim',time:clock(inboundLocal,exit),note:mode==='parking'?'Parking transfer allowance included.':'Install car seats; pickup wait varies.'});
  inbound.push({action:'Arrive home',time:drive?clock(inboundLocal,exit+drive):'Check drive time',note:'Driving estimate; allow additional ride pickup wait.'});
 }
 return {outbound,inbound,pair,airportBuffer};
}
