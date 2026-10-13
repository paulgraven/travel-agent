import test from 'node:test';import assert from 'node:assert/strict';import {makeTimeline,clock} from '../lib/timeline.js';
test('family schedule respects terminal walk, baggage and exact published trains',()=>{
 const rtd={verified:true,outbound:{centralParkToDEN:[{departCentralPark:'13:58',arriveDEN:'14:22'},{departCentralPark:'14:43',arriveDEN:'15:07'}]},return:{denToCentralPark:[{departDEN:'15:57',arriveCentralPark:'16:19'},{departDEN:'16:27',arriveCentralPark:'16:49'}]}};
 const p=makeTimeline({outboundLocal:'2026-10-14T17:30',inboundLocal:'2026-10-19T14:55',mode:'rtd',children:2,driveMinutes:15,rtd});
 assert.equal(p.pair.outbound.departCentralPark,'13:58');assert.equal(p.pair.inbound.departDEN,'16:27');assert.equal(p.outbound[0].time,'1:13pm');assert.equal(p.inbound.at(-1).time,'5:24pm');
});
test('no invented train or driving times when data unavailable',()=>{
 const p=makeTimeline({outboundLocal:'2026-10-14T17:30',inboundLocal:'2026-10-19T14:55',mode:'rtd',children:1});
 assert.equal(p.outbound[2].time,'Unverified');assert.equal(p.inbound.at(-1).time,'Check drive time');
 assert.equal(clock('00:10',-30),'11:40pm (previous day)');
});
