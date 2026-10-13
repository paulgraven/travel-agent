
import test from 'node:test';
import assert from 'node:assert/strict';
import {parkingCost,rtdCost,compareOptions,selectTrainPair} from '../lib/planner.js';
const out='2026-11-20T09:25:00-07:00',back='2026-11-23T17:55:00-07:00';
test('DEN economy parking uses published daily rate and trip duration',()=>{
 const p=parkingCost(out,back);
 assert.equal(p.days,4);assert.equal(p.cost,80);
});
test('RTD costs honor adult count, youth-free rides, district parking',()=>{
 assert.equal(rtdCost(out,back,1,'in').cost,26);
 assert.equal(rtdCost(out,back,2,'in').cost,46);
 assert.equal(rtdCost(out,back,2,'out').cost,56);
});
test('comparison preserves exact four columns and no made-up rideshare quote',()=>{
 const comparison=compareOptions({outboundFlight:out,inboundArrival:back,adults:2});
 assert.deepEqual(comparison.columns,['Option','Est. round-trip cost','Est. time','Convenience']);
 assert.equal(comparison.rows.length,3);
 assert.equal(comparison.rows[1].amount,null);
 assert.equal(comparison.rows[2].amount,46);
});
test('GTFS train selector honors flight buffer and return baggage buffer',()=>{
 const trains=[{departCentralPark:'06:12:00',arriveDEN:'06:49:00'},{departCentralPark:'06:42:00',arriveDEN:'07:19:00'}];
 const returnTrains=[{departDEN:'18:40:00',arriveCentralPark:'19:10:00'},{departDEN:'19:10:00',arriveCentralPark:'19:39:00'}];
 const r=selectTrainPair({outboundSchedule:trains,returnSchedule:returnTrains,outboundLocal:'2026-11-20T09:25',inboundLocal:'2026-11-23T17:55',travelers:'family'});
 assert.equal(r.outbound.departCentralPark,'06:12:00');assert.equal(r.inbound.departDEN,'19:10:00');
});
