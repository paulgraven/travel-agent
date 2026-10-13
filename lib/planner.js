
export const SOURCES={
  den:'https://www.flydenver.com/reserveparking/',
  denLots:'https://www.flydenver.com/parking-and-transportation/parking-lots/',
  fares:'https://www.rtd-denver.com/fares-passes/fares',
  parking:'https://www.rtd-denver.com/how-to-ride/parking',
  rtd:'https://app.rtd-denver.com/route/A/schedule',
  uber:'https://m.uber.com/looking',
  lyft:'https://www.lyft.com/rider'
};
export const RATES={denEconomyPerDay:20,rtdAirportPerAdultEachWay:10,rtdParkingInDistrictExtraDay:2,rtdParkingOutDistrictDay:4,updated:'2026-10-13'};
export function durationHours(start,end){
 const a=Date.parse(start),b=Date.parse(end);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||b-a>120*86400000)return null;
 return (b-a)/3600000;
}
export const roundUpDays=hours=>Number.isFinite(hours)&&hours>0?Math.ceil(hours/24):null;
export function parkingCost(outboundFlight,inboundArrival){
 const a=Date.parse(outboundFlight),b=Date.parse(inboundArrival);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a) return null;
 const parkedHours=(b-a)/3600000+4.5; // 3 hr before outbound, 1.5 hr after return
 return {days:roundUpDays(parkedHours),hours:Math.round(parkedHours*10)/10,cost:roundUpDays(parkedHours)*RATES.denEconomyPerDay};
}
export function rtdCost(outboundFlight,inboundArrival,adults=1,district='in'){
 const park=parkingCost(outboundFlight,inboundArrival);
 if(!park)return null;
 const a=Math.min(12,Math.max(1,Number(adults)||1));
 const trainFare=2*a*RATES.rtdAirportPerAdultEachWay;
 const parkFee=district==='out'?park.days*RATES.rtdParkingOutDistrictDay:Math.max(0,park.days-1)*RATES.rtdParkingInDistrictExtraDay;
 return {cost:trainFare+parkFee,trainFare,parking:parkFee,days:park.days,adults:a,district,source:RATES.updated};
}
export function compareOptions({outboundFlight,inboundArrival,adults=1,district='in',airport='DEN'}){
 if(airport!=='DEN')return {supported:false,message:'Detailed transport rates currently cover Denver International Airport. General travel mode comparison remains available.',rows:[]};
 const p=parkingCost(outboundFlight,inboundArrival),r=rtdCost(outboundFlight,inboundArrival,adults,district);
 return {supported:true,airport:'DEN',verifiedPrices:'published rate schedule, not live booking quotes',
  columns:['Option','Est. round-trip cost','Est. time','Convenience'],
  rows:[
   {id:'parking',option:'DEN Economy parking',amount:p?.cost??null,costType:p?'published-rate estimate':'unavailable',time:'50–75 min',
    convenience:'Drive yourself; economy lot shuttle to terminal',costDetail:p?'$20/day × '+p.days+' parked days; includes a planning buffer':'Trip dates required',source:SOURCES.den},
   {id:'rideshare',option:'Uber / Lyft XL',amount:null,costType:'quote required',time:'35–55 min',
    convenience:'Door-to-door; check seating and car-seat rules',costDetail:'No provider-approved live price access. Compare quotes in the apps.',source:SOURCES.uber,links:[{label:'Uber',url:SOURCES.uber},{label:'Lyft',url:SOURCES.lyft}]},
   {id:'rtd',option:'Central Park RTD + A Line',amount:r?.cost??null,costType:r?'published-rate estimate':'unavailable',time:'60–90 min',
    convenience:'Lowest cost; more luggage handling and train transfers',costDetail:r?'$'+r.trainFare+' round-trip fares + $'+r.parking+' parking ('+r.days+' days)':'Trip dates required',source:SOURCES.parking,
    links:[{label:'RTD fares',url:SOURCES.fares},{label:'Parking rules',url:SOURCES.parking}]}
  ],notes:['Round-trip costs; travel times are one-way, indicative Central Denver planning ranges rather than live traffic estimates.', 'Children 19 and under ride RTD free. '+(district==='in'?'In-district':'Out-of-district')+' Central Park parking assumed; verify license plate eligibility.','Parking duration assumes 3 hours before the outbound flight and 1.5 hours after the return arrival.'],
  faresAsOf:RATES.updated, sources:SOURCES
 };
}
function minutes(s){const m=/^(\d{1,2}):(\d{2})/.exec(s||'');return m?Number(m[1])*60+Number(m[2]):null}
function hhmm(n){if(!Number.isFinite(n))return null;const mins=((n%1440)+1440)%1440;return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0')}
export function selectTrainPair({outboundSchedule,returnSchedule,outboundLocal,inboundLocal,travelers='solo',international=false}){
 const flightOut=minutes(outboundLocal?.slice(11,16)),flightBack=minutes(inboundLocal?.slice(11,16));
 const airportBuffer=international?180:(travelers==='family'?150:120);
 const exitBuffer=travelers==='family'?60:45;
 const outbound=(outboundSchedule||[]).filter(t=>minutes(t.arriveDEN)!=null&&minutes(t.arriveDEN)<=flightOut-airportBuffer).sort((a,b)=>minutes(b.arriveDEN)-minutes(a.arriveDEN))[0]||null;
 const inbound=(returnSchedule||[]).filter(t=>minutes(t.departDEN)!=null&&minutes(t.departDEN)>=flightBack+exitBuffer).sort((a,b)=>minutes(a.departDEN)-minutes(b.departDEN))[0]||null;
 return {outbound,inbound,securityBufferMinutes:airportBuffer,baggageBufferMinutes:exitBuffer,
  latestRecommendedAirportArrival:flightOut==null?null:hhmm(flightOut-airportBuffer),
  earliestRecommendedDENTrain:flightBack==null?null:hhmm(flightBack+exitBuffer),
  verifiedPublishedTimes:Boolean(outbound&&inbound)};
}
