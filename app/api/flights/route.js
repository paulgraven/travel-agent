
import {getToken} from 'next-auth/jwt';
import {google} from 'googleapis';
import {calendarSegment,buildTrips} from '../../../lib/trips';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'};
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
 const calendar=google.calendar({version:'v3',auth});
 const url=new URL(request.url),home=/^[A-Z]{3}$/.test(url.searchParams.get('home')||'')?url.searchParams.get('home'):'DEN';
 const now=new Date(),end=new Date(now.getTime()+180*86400000);
 const warnings=[],segments=[];let calendarCount=0,calendarsScanned=0;
 try {
  const calendars=[];let pageToken;
  do {
   const response=await calendar.calendarList.list({maxResults:250,pageToken});
   calendars.push(...(response.data.items||[]).filter(c=>c.accessRole!=='freeBusyReader'));
   pageToken=response.data.nextPageToken;
  } while(pageToken);
  for(const c of calendars){
   try {
    let eventPage;
    do {
     const response=await calendar.events.list({calendarId:c.id,singleEvents:true,orderBy:'startTime',timeMin:new Date(now.getTime()-86400000).toISOString(),timeMax:end.toISOString(),maxResults:250,pageToken:eventPage});
     for(const e of response.data.items||[]){calendarCount++;const segment=calendarSegment(e);if(segment)segments.push(segment)}
     eventPage=response.data.nextPageToken;
    } while(eventPage);
    calendarsScanned++;
   } catch { warnings.push('One calendar could not be read. Other calendars were checked.'); }
  }
 } catch { return Response.json({error:'Google Calendar could not be read. Reconnect Google and grant read-only Calendar access.'},{status:403,headers:noStore}); }
 const trips=buildTrips(segments,[],home,now);
 if(!trips.length)warnings.push('No upcoming flights identified in Calendar. Confirm your home airport or enter flights manually.');
 return Response.json({trips,warnings,summary:{calendarEventsScanned:calendarCount,calendarsScanned,calendarFlightsFound:segments.length},homeAirport:home,asOf:new Date().toISOString(),source:'Google Calendar only'},{headers:noStore});
}
