import test from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '../app/api/rtd/route.js';
const base='http://localhost/api/rtd?';
const demo={
 routeShortName:'A',
 runboard:{id:'3845',startDate:'2026-09-27',endDate:'2027-01-02'},
 serviceSchedules:{
  '32_A___Eastbound_5_3845':{stops:['Central Park Station','Denver Airport Station'],trips:[['613A','637A'],['643A','707A']]},
  '32_A___Westbound_5_3845':{stops:['Denver Airport Station','Central Park Station'],trips:[['657P','719P']]},
  '32_A___Eastbound_4_3845':{stops:['Central Park Station','Denver Airport Station'],trips:[['613A','637A']]},
  '32_A___Westbound_4_3845':{stops:['Denver Airport Station','Central Park Station'],trips:[['657P','719P']]}
 }
};
test('RTD uses official schedule period, verifies date-scoped trains only',async()=>{
 const original=global.fetch;
 global.fetch=async()=>new Response('<html><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:demo}})+'</script></html>',{status:200});
 try{
  const r=await GET(new Request(base+'outboundDate=2026-11-20&returnDate=2026-11-23'));
  const data=await r.json();
  assert.equal(data.verified,true);
  assert.deepEqual(data.outbound.centralParkToDEN[0],{departCentralPark:'06:13:00',arriveDEN:'06:37:00'});
  assert.deepEqual(data.return.denToCentralPark[0],{departDEN:'18:57:00',arriveCentralPark:'19:19:00'});
 }finally{global.fetch=original}
});
test('RTD holidays and unsupported schedule dates are never verified',async()=>{
 let r=await GET(new Request(base+'outboundDate=2026-11-26&returnDate=2026-11-27'));
 assert.equal((await r.json()).verified,false);
 const original=global.fetch;
 global.fetch=async()=>new Response('<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:demo}})+'</script>');
 try{
  r=await GET(new Request(base+'outboundDate=2027-05-20&returnDate=2027-05-23'));
  assert.equal((await r.json()).verified,false);
 }finally{global.fetch=original}
});
