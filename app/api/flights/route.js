import {getToken} from 'next-auth/jwt';
import {google} from 'googleapis';
export const dynamic='force-dynamic';
const code=/\b(?:DEN|MSP|JFK|LGA|EWR|ORD|MDW|LAX|SFO|SEA|ATL|DFW|DAL|IAH|HOU|PHX|LAS|BOS|DCA|IAD|BWI|MIA|FLL|MCO|TPA|SAN|SLC|PDX|DTW|CLT|HOU|HPN)\b/g;
const airline=/\b(?:UA|DL|WN|AA|AS|B6|F9|NK|United|Delta|Southwest|American|Alaska|JetBlue|Frontier|Spirit)\s*(?:Airlines?)?\s*(?:flight|#|number|no\.?|:)??\s*#?\s*(\d{1,4})\b/i;
function localDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(s)?s.slice(0,16):null}
function extract(e){
 const summary=e.summary||'',desc=e.description||'',location=e.location||'',text=[summary,desc,location].join(' ');
 if(e.status==='cancelled'||!e.start?.dateTime||!/\b(flight|airlines?|airport|depart|arriv|\b(?:UA|DL|WN|AA|AS|B6|F9|NK)\s*\d{2,4})\b/i.test(text))return null;
 const airports=[...new Set((text.match(code)||[]))],match=text.match(airline),route=summary.match(/\b([A-Z]{3})\s*(?:→|->|to|–|-)\s*([A-Z]{3})\b/i);
 const from=route?.[1]||airports[0]||null,to=route?.[2]||airports.find(a=>a!==from)||null;
 return {id:e.id,summary,from,to,flight:match?match[0].replace(/\s+/g,' ').trim():null,departure:e.start.dateTime,arrival:e.end?.dateTime||null,departureLocal:localDate(e.start.dateTime),arrivalLocal:localDate(e.end?.dateTime),source:'calendar',confidence:route&&match?'high':from&&to?'medium':'low',link:e.htmlLink||null};
}
function group(items){
 const byDate=new Map();
 for(const f of items){const d=f.departureLocal?.slice(0,10);if(!d)continue;const key=[d,f.from||'',f.to||'',f.flight||''].join('|');if(!byDate.has(key))byDate.set(key,f);else if(f.confidence==='high')byDate.set(key,f)}
 const all=[...byDate.values()].sort((a,b)=>a.departure.localeCompare(b.departure));
 const trips=[];for(const f of all){if(!f.from||!f.to)continue;let trip=trips.find(t=>t.segments.length<5&&t.segments[t.segments.length-1].to===f.from&&Date.parse(f.departure)-Date.parse(t.segments[t.segments.length-1].departure)<21*86400000&&Date.parse(f.departure)>Date.parse(t.segments[t.segments.length-1].departure));if(!trip){trip={id:'trip-'+trips.length,segments:[]};trips.push(trip)}trip.segments.push(f)}
 return trips.map(t=>({...t,start:t.segments[0].departure,end:t.segments[t.segments.length-1].arrival||t.segments[t.segments.length-1].departure,origin:t.segments[0].from,destination:t.segments[0].to})).sort((a,b)=>a.start.localeCompare(b.start));
}
export async function GET(request){
 const token=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
 if(!token?.googleAccessToken)return Response.json({error:'Google sign-in required'},{status:401});
 const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token.googleAccessToken});
 const gmail=google.gmail({version:'v1',auth}),calendar=google.calendar({version:'v3',auth});
 const start=new Date(),end=new Date(start.getTime()+180*86400000);
 const [mailResult,calendarResult]=await Promise.allSettled([
 gmail.users.messages.list({userId:'me',q:'(subject:(flight OR itinerary OR e-ticket OR confirmation) OR from:(united.com OR delta.com OR southwest.com OR aa.com)) newer_than:180d',maxResults:45}),
 calendar.events.list({calendarId:'primary',timeMin:start.toISOString(),timeMax:end.toISOString(),singleEvents:true,maxResults:250,orderBy:'startTime'})
 ]);
 const output={trips:[],warnings:[],mailHints:[]};
 if(calendarResult.status==='fulfilled'){
  const flights=(calendarResult.value.data.items||[]).map(extract).filter(Boolean);
  output.trips=group(flights);
 }else output.warnings.push('Calendar access unavailable');
 if(mailResult.status==='fulfilled'){
  const results=await Promise.allSettled((mailResult.value.data.messages||[]).slice(0,25).map(m=>gmail.users.messages.get({userId:'me',id:m.id,format:'metadata',metadataHeaders:['Subject','Date']})));
  output.mailHints=results.filter(r=>r.status==='fulfilled').map(r=>({subject:r.value.data.payload?.headers?.find(h=>h.name.toLowerCase()==='subject')?.value||'',date:r.value.data.payload?.headers?.find(h=>h.name.toLowerCase()==='date')?.value||''})).filter(x=>/flight|itinerary|ticket|confirmation|airlines?/i.test(x.subject)).slice(0,8);
 }else output.warnings.push('Gmail access unavailable');
 if(!output.trips.length)output.warnings.push('No complete upcoming flight itineraries could be extracted from Calendar. Check flight details manually; email hints are not confirmed bookings.');
 return Response.json(output,{headers:{'Cache-Control':'private, no-store'}});
}
