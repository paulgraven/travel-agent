import test from 'node:test';import assert from 'node:assert/strict';import {discoverCalendarTrips} from '../lib/calendar-discovery.js';
const event={id:'out',summary:'Flight DEN → MSP UA2076',start:{dateTime:'2026-10-14T17:30:00-06:00'},end:{dateTime:'2026-10-14T20:32:00-05:00'}};
test('Calendar discovery paginates calendars and events, deduplicates shared flights',async()=>{
 const calls=[];const calendar={calendarList:{list:async({pageToken})=>({data:pageToken?{items:[{id:'shared'}]}:{items:[{id:'primary'},{id:'freebusy',accessRole:'freeBusyReader'}],nextPageToken:'next'}})},events:{list:async({calendarId,pageToken})=>{calls.push([calendarId,pageToken]);return {data:calendarId==='primary'&&!pageToken?{items:[],nextPageToken:'events-next'}:{items:[event]}}}}};
 const r=await discoverCalendarTrips(calendar,'DEN',new Date('2026-10-13T12:00:00Z'));assert.equal(r.trips.length,1);assert.equal(r.trips[0].segments.length,1);assert.equal(r.summary.calendarsScanned,2);assert.equal(calls.length,3);assert.equal(r.source,'Google Calendar only');
});
test('partial failures report warnings; total failures are not presented as no flights',async()=>{
 const calendar={calendarList:{list:async()=>({data:{items:[{id:'bad'},{id:'good'}]}})},events:{list:async({calendarId})=>{if(calendarId==='bad')throw Error('403');return {data:{items:[event]}}}}};
 const r=await discoverCalendarTrips(calendar,'DEN',new Date('2026-10-13T12:00:00Z'));assert.equal(r.warnings.length,1);assert.equal(r.trips.length,1);
 calendar.events.list=async()=>{throw Error('403')};await assert.rejects(discoverCalendarTrips(calendar),/No calendars could be read/);
});
