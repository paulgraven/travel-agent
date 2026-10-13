
import {getToken} from 'next-auth/jwt';
import {google} from 'googleapis';
import {calendarSegment,mailEvidence,buildTrips} from '../../../lib/trips';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'};
function readPart(part,output,limit=13000){
 if(!part||output.length>4)return;
 if(part.mimeType==='text/plain'&&part.body?.data){
  try{output.push(Buffer.from(part.body.data.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8').slice(0,limit))}catch{}
 }
 for(const p of part.parts||[])readPart(p,output,limit);
 if(!output.length&&part.mimeType==='text/html'&&part.body?.data){
  try{output.push(Buffer.from(part.body.data.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8').slice(0,limit).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi,' '))}catch{}
 }
}
async function googleClient(token){
 let accessToken=token.googleAccessToken;
 if(token.googleExpiresAt&&Date.now()>=Number(token.googleExpiresAt)-60_000){
  if(!token.googleRefreshToken)throw Error('Your Google session expired. Reconnect Google.');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:token.googleRefreshToken,grant_type:'refresh_token'}),cache:'no-store'});
  if(!response.ok)throw Error('Your Google session needs reauthorization. Reconnect Google.');
  const data=await response.json();accessToken=data.access_token;
 }
 const client=new google.auth.OAuth2();client.setCredentials({access_token:accessToken});return client;
}
export async function GET(request){
 const jwt=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
 if(!jwt?.googleAccessToken)return Response.json({error:'Connect your Google account to find flights.'},{status:401,headers:noStore});
 let auth;
 try{auth=await googleClient(jwt)}catch(e){return Response.json({error:e.message},{status:401,headers:noStore})}
 const calendar=google.calendar({version:'v3',auth}),gmail=google.gmail({version:'v1',auth});
 const url=new URL(request.url),home=/^[A-Z]{3}$/.test(url.searchParams.get('home')||'')?url.searchParams.get('home'):'DEN';
 const now=new Date(),end=new Date(now.getTime()+180*86400000);
 const [calResult,mailResult]=await Promise.allSettled([
   calendar.events.list({calendarId:'primary',singleEvents:true,orderBy:'startTime',timeMin:new Date(now.getTime()-86400000).toISOString(),timeMax:end.toISOString(),maxResults:250}),
   gmail.users.messages.list({userId:'me',maxResults:60,q:'newer_than:365d {subject:itinerary subject:flight subject:e-ticket subject:confirmation subject:reservation from:united.com from:delta.com from:southwest.com from:aa.com from:jetblue.com}'})
 ]);
 const warnings=[],calendarFlights=[],mailFlights=[];let calendarCount=0,emailCount=0;
 if(calResult.status==='fulfilled'){
   const items=calResult.value.data.items||[];
   calendarCount=items.length;
   for(const e of items){const flight=calendarSegment(e);if(flight)calendarFlights.push(flight)}
   if(calResult.value.data.nextPageToken)warnings.push('Only the first calendar results page was inspected; some later events may be missing.');
 }else warnings.push('Google Calendar data could not be read. Check Calendar permissions.');
 if(mailResult.status==='fulfilled'){
   const ids=(mailResult.value.data.messages||[]).slice(0,48);
   for(let i=0;i<ids.length;i+=8){
     const chunk=await Promise.allSettled(ids.slice(i,i+8).map(m=>gmail.users.messages.get({userId:'me',id:m.id,format:'full'})));
     for(const response of chunk){
       if(response.status!=='fulfilled')continue;
       emailCount++;
       const m=response.value.data;
       const header=name=>(m.payload?.headers||[]).find(x=>x.name.toLowerCase()===name)?.value||'';
       const parts=[];readPart(m.payload,parts);
       const evidence=mailEvidence({id:m.id,subject:header('subject'),body:parts.join(' ').slice(0,20000)});
       if(evidence)mailFlights.push(evidence);
     }
   }
 }else warnings.push('Gmail messages could not be searched. Check Gmail permissions.');
 const trips=buildTrips(calendarFlights,mailFlights,home,now);
 if(!trips.length)warnings.push('No confirmed future trips were identified. Try a different home airport or add flight details manually.');
 if(!calendarFlights.length&&mailFlights.length)warnings.push('Gmail yielded possible flight confirmations, but the dates or airport details were not complete enough to construct a reliable itinerary.');
 return Response.json({trips,warnings,summary:{calendarEventsScanned:calendarCount,calendarFlightsFound:calendarFlights.length,emailsInspected:emailCount,emailEvidenceFound:mailFlights.length},homeAirport:home,asOf:new Date().toISOString()},{headers:noStore});
}
