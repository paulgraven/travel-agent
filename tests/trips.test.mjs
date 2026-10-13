
import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarSegment,mailEvidence,buildTrips,DEMO_TRIPS} from '../lib/trips.js';
test('rejects unrelated calendar entries and canceled flights',()=>{
 assert.equal(calendarSegment({summary:'Morning planning meeting',start:{dateTime:'2026-11-20T09:00:00-07:00'}}),null);
 assert.equal(calendarSegment({status:'cancelled',summary:'Flight UA100 DEN to SEA',start:{dateTime:'2026-11-20T09:00:00-07:00'}}),null);
});
test('extracts route, departure, arrival and flight number',()=>{
 const s=calendarSegment({id:'a',summary:'Flight UA2076 DEN to MSP',start:{dateTime:'2026-10-14T17:30:00-06:00'},end:{dateTime:'2026-10-14T20:20:00-05:00'}});
 assert.equal(s.from,'DEN');assert.equal(s.to,'MSP');assert.equal(s.flightNumber,'UA2076');
 assert.equal(s.departureLocal,'2026-10-14T17:30');assert.equal(s.arrivalLocal,'2026-10-14T20:20');
});
test('deduplicates flights, groups return segments, and matches Gmail evidence',()=>{
 const out=calendarSegment({id:'1',summary:'Flight UA2076 DEN → MSP',start:{dateTime:'2026-11-20T17:30:00-07:00'},end:{dateTime:'2026-11-20T20:20:00-06:00'}});
 const dupe={...out,id:'duplicate'};
 const back=calendarSegment({id:'2',summary:'Flight UA1305 MSP to DEN',start:{dateTime:'2026-11-23T13:00:00-06:00'},end:{dateTime:'2026-11-23T14:55:00-07:00'}});
 const mail=mailEvidence({id:'mail1',subject:'United Airlines flight UA2076 confirmation',body:'Flight UA2076 DEN to MSP November 20, 2026 5:30 PM'});
 const trips=buildTrips([back,out,dupe],[mail],'DEN',new Date('2026-10-13T10:00:00-06:00'));
 assert.equal(trips.length,1);assert.equal(trips[0].segments.length,2);
 assert.equal(trips[0].inbound.to,'DEN');assert.equal(trips[0].gmailCorroborated,true);
});
test('does not expose actual personal flights in fictional demo',()=>{
 assert.equal(DEMO_TRIPS.length,1);
 assert.ok(DEMO_TRIPS[0].segments.every(x=>x.flightNumber.startsWith('DEMO')));
 assert.equal(DEMO_TRIPS[0].outbound.from,'DEN');
});

test('Google fromGmail event title plus origin location resolves route and airport-local times',()=>{
 const x=calendarSegment({
   id:'imported',eventType:'fromGmail',summary:'Flight to Minneapolis/St. Paul (UA 4321)',
   location:'Denver DEN',
   start:{dateTime:'2026-11-20T17:30:00-07:00'},
   end:{dateTime:'2026-11-20T19:32:00-07:00'}
 });
 assert.equal(x.from,'DEN');assert.equal(x.to,'MSP');
 assert.equal(x.departureLocal,'2026-11-20T17:30');
 assert.equal(x.arrivalLocal,'2026-11-20T20:32');
});
test('Westchester County maps to HPN without guessing New York-area airports',()=>{
 const x=calendarSegment({
  id:'east',summary:'Flight to Westchester County (DL 987)',location:'Minneapolis MSP',
  start:{dateTime:'2026-12-26T11:45:00-07:00'},
  end:{dateTime:'2026-12-26T14:38:00-07:00'}
 });
 assert.equal(x.from,'MSP');assert.equal(x.to,'HPN');
 assert.equal(x.departureLocal,'2026-12-26T12:45');
 assert.equal(x.arrivalLocal,'2026-12-26T16:38');
});
