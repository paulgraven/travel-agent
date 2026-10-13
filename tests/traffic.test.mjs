import test from 'node:test';import assert from 'node:assert/strict';import {drivingEstimate} from '../lib/traffic.js';
test('missing credentials cause no requests and no invented traffic',async()=>{
 let called=false;const r=await drivingEstimate({origin:'123 Example St, Denver, CO',key:'',fetcher:async()=>{called=true}});assert.equal(r.available,false);assert.equal(called,false);
});
test('traffic adapter uses fixed official endpoint, field masks and future-aware labels',async()=>{
 const departureTime=new Date(Date.now()+86400000).toISOString();
 const r=await drivingEstimate({origin:'123 Example St, Denver, CO',destination:'station',departureTime,key:'test-only',fetcher:async(url,options)=>{
 assert.equal(url,'https://routes.googleapis.com/directions/v2:computeRoutes');const body=JSON.parse(options.body);assert.equal(body.routingPreference,'TRAFFIC_AWARE');assert.equal(body.departureTime,departureTime);assert.match(body.destination.address,/Central Park/);return Response.json({routes:[{duration:'1801s',staticDuration:'1500s',distanceMeters:7000}]});
 }});assert.equal(r.minutes,31);assert.equal(r.type,'traffic-aware forecast');
});
test('provider errors never reveal keys or claim verified traffic',async()=>{
 const r=await drivingEstimate({origin:'123 Example St, Denver, CO',key:'secret-test',fetcher:async()=>Response.json({error:'secret-test'},{status:403})});assert.equal(r.available,false);assert.ok(!JSON.stringify(r).includes('secret-test'));
});
