
export const dynamic='force-dynamic';
export const runtime='nodejs';
const OFFICIAL='https://app.rtd-denver.com/route/A/schedule';
const HOLIDAYS=new Set(['2026-11-26','2026-12-25','2027-01-01','2026-10-12','2026-11-11','2026-12-24','2026-12-31']);
const valid=d=>/^\d{4}-\d\d-\d\d$/.test(d||'')&&!Number.isNaN(Date.parse(d));
function service(date){
 const d=new Date(date+'T12:00:00Z').getUTCDay();
 if(HOLIDAYS.has(date))return null;
 return d===0?2:d===6?1:d===5?5:4;
}
function convertTime(code){
 const m=String(code||'').match(/^(\d{1,2})(\d{2})([AP])$/i);
 if(!m)return null;
 const hour=Number(m[1]),minute=Number(m[2]);
 if(hour<1||hour>12||minute>59)return null;
 const h=hour%12+(m[3].toUpperCase()==='P'?12:0);
 return String(h).padStart(2,'0')+':'+String(minute).padStart(2,'0')+':00';
}
function readSchedule(schedules,board,direction,kind){
 const schedule=schedules['32_A___'+direction+'_'+kind+'_'+board];
 if(!schedule?.stops?.length||!schedule?.trips?.length)return null;
 const central=schedule.stops.findIndex(x=>/Central Park Station/i.test(x));
 const den=schedule.stops.findIndex(x=>/Denver Airport Station/i.test(x));
 if(central<0||den<0)return null;
 const keys=direction==='Eastbound'?['departCentralPark','arriveDEN']:['departDEN','arriveCentralPark'];
 const rows=schedule.trips.map(t=>({
    [keys[0]]:convertTime(t[direction==='Eastbound'?central:den]),
    [keys[1]]:convertTime(t[direction==='Eastbound'?den:central])
 })).filter(x=>x[keys[0]]&&x[keys[1]]);
 if(!rows.length)return null;
 return rows;
}
export async function GET(request){
 const q=new URL(request.url).searchParams;
 const outboundDate=q.get('outboundDate'),returnDate=q.get('returnDate');
 if(!valid(outboundDate)||!valid(returnDate))return Response.json({verified:false,error:'Use outboundDate and returnDate as YYYY-MM-DD.'},{status:400});
 if(!service(outboundDate)||!service(returnDate))return Response.json({verified:false,error:'The requested date is a possible holiday or special-service day. Confirm the official RTD schedule for this date.',officialSchedule:OFFICIAL},{status:200,headers:{'Cache-Control':'no-store'}});
 try{
  const response=await fetch(OFFICIAL,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('RTD source unavailable');
  const html=await response.text();
  const match=html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if(!match)throw Error('Official schedule data missing');
  const data=JSON.parse(match[1])?.props?.pageProps;
  const board=data?.runboard;
  if(data?.routeShortName!=='A'||!board?.id||!board?.startDate||!board?.endDate)throw Error('Invalid route timetable');
  if([outboundDate,returnDate].some(d=>d<board.startDate||d>board.endDate)){
   return Response.json({verified:false,error:'RTD official schedule does not currently cover these dates.',availablePeriod:{start:board.startDate,end:board.endDate},officialSchedule:OFFICIAL},{headers:{'Cache-Control':'no-store'}});
  }
  function dateRows(date){
   const day=service(date),east=readSchedule(data.serviceSchedules,board.id,'Eastbound',day),west=readSchedule(data.serviceSchedules,board.id,'Westbound',day);
   if(!east||!west)return null;
   return {date,serviceType:day,centralParkToDEN:east,denToCentralPark:west};
  }
  const outbound=dateRows(outboundDate),returned=dateRows(returnDate);
  if(!outbound||!returned)throw Error('Date-specific service unavailable');
  return Response.json({verified:true,verificationType:'published service-day timetable within effective period',dateSpecificExceptionsVerified:false,realtimeVerified:false,warning:'Published train times verified. Date-specific exceptions, disruptions and punctuality are not verified.',source:OFFICIAL,asOf:new Date().toISOString(),schedulePeriod:{start:board.startDate,end:board.endDate},outbound,return:returned},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({verified:false,error:'Could not verify RTD published A Line timetable.',officialSchedule:OFFICIAL},{status:502,headers:{'Cache-Control':'no-store'}})}
}
