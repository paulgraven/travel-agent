import {calendarSegment,buildTrips} from './trips.js';
export async function discoverCalendarTrips(calendar,home='DEN',now=new Date()){
 const end=new Date(now.getTime()+180*86400000),calendars=[],warnings=[],segments=[];
 let pageToken,calendarCount=0,calendarsScanned=0;
 do{const r=await calendar.calendarList.list({maxResults:250,pageToken});calendars.push(...(r.data.items||[]).filter(c=>c.accessRole!=='freeBusyReader'));pageToken=r.data.nextPageToken}while(pageToken);
 for(const c of calendars){
  try{let eventPage;do{const r=await calendar.events.list({calendarId:c.id,singleEvents:true,orderBy:'startTime',timeMin:new Date(now.getTime()-86400000).toISOString(),timeMax:end.toISOString(),maxResults:250,pageToken:eventPage});for(const e of r.data.items||[]){calendarCount++;const s=calendarSegment(e);if(s)segments.push(s)}eventPage=r.data.nextPageToken}while(eventPage);calendarsScanned++}catch{warnings.push('One calendar could not be read. Other calendars were checked.')}
 }
 if(calendars.length&&!calendarsScanned)throw Error('No calendars could be read. Reconnect Google and grant read-only Calendar access.');
 const trips=buildTrips(segments,[],home,now);
 if(!trips.length)warnings.push('No upcoming flights identified in Calendar. Confirm your home airport or enter flights manually.');
 return {trips,warnings,summary:{calendarEventsScanned:calendarCount,calendarsScanned,calendarFlightsFound:segments.length},homeAirport:home,asOf:new Date().toISOString(),source:'Google Calendar only'};
}
