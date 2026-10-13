
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
  district:q.get('district')==='out'?'out':'in',
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
 return Response.json(options,{headers:{'Cache-Control':'no-store'}});
}
