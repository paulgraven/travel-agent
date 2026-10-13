import {getToken} from 'next-auth/jwt';
import {google} from 'googleapis';
export const dynamic='force-dynamic';
export async function GET(request){
 const token=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
 if(!token?.googleAccessToken)return Response.json({error:'Google sign-in required'},{status:401});
 const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token.googleAccessToken});
 const gmail=google.gmail({version:'v1',auth}),calendar=google.calendar({version:'v3',auth});
 const start=new Date(),end=new Date(start.getTime()+180*86400000);
 const [mailResult,calendarResult]=await Promise.allSettled([
 gmail.users.messages.list({userId:'me',q:'(flight OR itinerary OR confirmation OR boarding) newer_than:180d',maxResults:35}),
 calendar.events.list({calendarId:'primary',timeMin:start.toISOString(),timeMax:end.toISOString(),singleEvents:true,maxResults:250,orderBy:'startTime'})
 ]);
 const output={calendar:[],gmail:[],warnings:[]};
 if(calendarResult.status==='fulfilled')output.calendar=(calendarResult.value.data.items||[]).filter(e=>/flight|airport|travel|\b[A-Z]{2}\s?\d{2,4}\b/i.test([e.summary,e.description,e.location].join(' '))).map(e=>({summary:e.summary,start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,location:e.location||null,source:'Google Calendar'}));
 else output.warnings.push('Calendar API unavailable');
 if(mailResult.status==='fulfilled'){
  const results=await Promise.allSettled((mailResult.value.data.messages||[]).slice(0,25).map(m=>gmail.users.messages.get({userId:'me',id:m.id,format:'metadata',metadataHeaders:['Subject','Date']})));
  output.gmail=results.filter(r=>r.status==='fulfilled').map(r=>({subject:r.value.data.payload?.headers?.find(h=>h.name.toLowerCase()==='subject')?.value||'',date:r.value.data.payload?.headers?.find(h=>h.name.toLowerCase()==='date')?.value||'',snippet:r.value.data.snippet||'',source:'Gmail'}));
 }else output.warnings.push('Gmail API unavailable');
 output.warnings.push('Search results are candidate itineraries; confirm booking and exact times.');
 return Response.json(output,{headers:{'Cache-Control':'private, no-store'}});
}
