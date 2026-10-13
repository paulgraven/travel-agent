
import {checkRates} from '../../../lib/rates';
import {compareOptions,SOURCES} from '../../../lib/planner';
export const dynamic='force-dynamic';
export async function GET(request){
 const q=new URL(request.url).searchParams;
 const adults=Number(q.get('adults')||'1');
 const homeAirport=(q.get('airport')||'DEN').toUpperCase();
 const options=compareOptions({
  outboundFlight:q.get('outboundFlight')||q.get('parkingStart'),
  inboundArrival:q.get('inboundArrival')||q.get('parkingEnd'),
  adults:Number.isFinite(adults)?adults:1,
  district:'in',
  airport:homeAirport
 });
 if(!options.supported){
   return Response.json({...options,columns:['Option','Est. round-trip cost','Est. time','Convenience'],
     rows:[
       {id:'parking',option:'Airport parking',amount:null,costType:'destination data unavailable',time:null,convenience:'Drive yourself; compare official airport parking'},
       {id:'rideshare',option:'Uber / Lyft',amount:null,costType:'provider quote required',time:null,convenience:'Request a quote in the provider app',links:[{label:'Uber',url:SOURCES.uber},{label:'Lyft',url:SOURCES.lyft}]},
       {id:'rtd',option:'Public transit',amount:null,costType:'local service data unavailable',time:null,convenience:'Consult the local transit provider'}
     ]},{headers:{'Cache-Control':'no-store'}});
 }
 const verification=await checkRates();
 options.rateVerification=verification;
 for(const row of options.rows){if(row.id==='parking'&&!verification.checks[0].verified||row.id==='rtd'&&(!verification.checks[1].verified||!verification.checks[2].verified)){row.costType='saved-rate estimate; current rate unverified';row.costDetail+=' · Current source could not be verified.'}}
 options.notes.push('Rate sources checked '+verification.checkedAt+'. Live ride fares unavailable: provider credentials not configured.');
 return Response.json(options,{headers:{'Cache-Control':'no-store'}});
}
