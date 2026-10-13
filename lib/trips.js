
const AIRPORTS = new Set(('DEN MSP HPN JFK LGA EWR BOS PHL BWI DCA IAD ORD MDW DTW CLE CMH CVG IND MCI STL BNA ATL CLT RDU RIC CHS SAV MCO TPA MIA FLL PBI JAX MSY AUS DFW DAL IAH HOU SAT OKC TUL ABQ PHX LAS SLC BOI SEA PDX SFO SJC OAK SMF LAX BUR SNA ONT SAN PSP HNL OGG LIH KOA ANC YYZ YVR YUL CUN LHR LGW CDG AMS FRA MUC DUB FCO MAD BCN LIS NRT HND ICN GRU MEX').split(' '));
const AIRLINES = {United:'UA',Delta:'DL',Southwest:'WN',American:'AA',Alaska:'AS',JetBlue:'B6',Frontier:'F9',Spirit:'NK'};

const DESTINATIONS={
 'minneapolis/st. paul':'MSP','minneapolis/st paul':'MSP','minneapolis':'MSP','st. paul':'MSP','saint paul':'MSP',
 'denver':'DEN','westchester county':'HPN','white plains':'HPN','seattle':'SEA','portland':'PDX',
 'boston':'BOS','san francisco':'SFO','los angeles':'LAX','chicago o hare':'ORD','chicago o\'hare':'ORD',
 'phoenix':'PHX','salt lake city':'SLC','atlanta':'ATL','miami':'MIA','las vegas':'LAS',
 'dallas fort worth':'DFW','dallas':'DFW','austin':'AUS','houston hobby':'HOU','houston intercontinental':'IAH',
 'nashville':'BNA','orlando':'MCO','san diego':'SAN','tampa':'TPA','charlotte':'CLT','newark':'EWR',
 'washington dulles':'IAD','reagan national':'DCA','baltimore':'BWI'
};
const ZONES={
 DEN:'America/Denver',SLC:'America/Denver',PHX:'America/Phoenix',ABQ:'America/Denver',BOI:'America/Boise',
 MSP:'America/Chicago',ORD:'America/Chicago',MDW:'America/Chicago',DFW:'America/Chicago',DAL:'America/Chicago',IAH:'America/Chicago',HOU:'America/Chicago',AUS:'America/Chicago',STL:'America/Chicago',MCI:'America/Chicago',BNA:'America/Chicago',MSY:'America/Chicago',
 HPN:'America/New_York',JFK:'America/New_York',LGA:'America/New_York',EWR:'America/New_York',BOS:'America/New_York',DCA:'America/New_York',IAD:'America/New_York',BWI:'America/New_York',ATL:'America/New_York',CLT:'America/New_York',MCO:'America/New_York',TPA:'America/New_York',MIA:'America/New_York',FLL:'America/New_York',RDU:'America/New_York',
 SEA:'America/Los_Angeles',PDX:'America/Los_Angeles',LAX:'America/Los_Angeles',SFO:'America/Los_Angeles',OAK:'America/Los_Angeles',SJC:'America/Los_Angeles',SAN:'America/Los_Angeles',SNA:'America/Los_Angeles',LAS:'America/Los_Angeles',
 HNL:'Pacific/Honolulu',OGG:'Pacific/Honolulu',LIH:'Pacific/Honolulu',
 YYZ:'America/Toronto',YVR:'America/Vancouver',YUL:'America/Toronto',LHR:'Europe/London',CDG:'Europe/Paris'
};
export function airportLocalISO(dateTime,airport){
 if(!dateTime)return null;
 const zone=ZONES[airport];if(!zone)return localISO(dateTime);
 const date=new Date(dateTime);if(Number.isNaN(+date))return localISO(dateTime);
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const get=type=>parts.find(x=>x.type===type)?.value;
 return get('year')+'-'+get('month')+'-'+get('day')+'T'+get('hour')+':'+get('minute');
}

const MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const normal = s => String(s || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const codes = text => [...new Set((text.match(/\b[A-Z]{3}\b/g)||[]).filter(c=>AIRPORTS.has(c)))];
export const localISO = value => typeof value==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(value) ? value.slice(0,16) : null;
function details(text,summary='',location='') {
  const raw = normal(text);
  const explicit = raw.match(/\b([A-Z]{3})\s*(?:→|->|to|–|-|\/)\s*([A-Z]{3})\b/i);
  const hits = codes(raw);
  const startCode=codes(location)[0]||null;
  const flightTo=normal(summary).match(/\bflight\s+to\s+(.+?)(?:\s*\(|$)/i);
  const destinationName=flightTo?.[1]?.trim().replace(/[,.;]+$/,'').toLowerCase()||'';
  const dest=DESTINATIONS[destinationName]||null;
  const from = explicit && AIRPORTS.has(explicit[1].toUpperCase()) ? explicit[1].toUpperCase() : startCode||hits[0]||null;
  const to = explicit && AIRPORTS.has(explicit[2].toUpperCase()) ? explicit[2].toUpperCase() : dest||hits.find(c=>c!==from)||null;
  const flight = raw.match(/\b(UA|DL|WN|AA|AS|B6|F9|NK)\s*[-#]?\s*(\d{1,4})\b/i);
  let flightNumber = flight ? flight[1].toUpperCase()+flight[2] : null;
  if (!flightNumber) for (const [name,abbrev] of Object.entries(AIRLINES)) {
    const match = raw.match(new RegExp('\\b'+name+'(?: Airlines?)?\\s*(?:flight\\s*)?#?\\s*(\\d{1,4})\\b','i'));
    if (match) {flightNumber=abbrev+match[1];break;}
  }
  return {from,to,flightNumber};
}
export function calendarSegment(e) {
  if (!e || e.status==='cancelled' || !e.start?.dateTime) return null;
  const summary=normal(e.summary),description=normal(e.description),location=normal(e.location);
  const text=[summary,description,location].join(' ');
  if (!/\b(flight|airline|departure|boarding|(?:UA|DL|WN|AA|AS|B6|F9|NK)\s*\d{2,4})\b/i.test(text)) return null;
  const d=details(text,summary,location);
  if (!d.from || !d.to || d.from===d.to) return null;
  return {id:String(e.id||summary),from:d.from,to:d.to,flightNumber:d.flightNumber,
    departure:e.start.dateTime,arrival:e.end?.dateTime||null,
    departureLocal:airportLocalISO(e.start.dateTime,d.from),arrivalLocal:airportLocalISO(e.end?.dateTime,d.to),
    source:'Google Calendar',evidence:['calendar'],confidence:d.flightNumber?'high':'medium',
    sourceUrl:e.htmlLink||null};
}
function parseMailDate(text) {
  const iso = text.match(/\b(20\d\d)[-\/](0[1-9]|1[0-2])[-\/]([0-2]\d|3[01])[ T]([01]\d|2[0-3]):([0-5]\d)\b/);
  if(iso)return iso[1]+'-'+iso[2]+'-'+iso[3]+'T'+iso[4]+':'+iso[5];
  const date=text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d\d)\b/i);
  const time=text.match(/\b(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)\b/i);
  if(!date||!time)return null;
  const hr=(Number(time[1])%12)+(time[3].toUpperCase()==='PM'?12:0);
  return date[3]+'-'+String(MONTHS[date[1].slice(0,3).toLowerCase()]).padStart(2,'0')+'-'+date[2].padStart(2,'0')+'T'+String(hr).padStart(2,'0')+':'+time[2];
}
export function mailEvidence(email) {
  const subject=normal(email.subject), body=normal(email.body).slice(0,18000);
  if(!/\b(flight|itinerary|e.ticket|reservation|confirmation|airline|boarding)\b/i.test(subject+' '+body.slice(0,500)))return null;
  const d=details(subject+' '+body,subject,'');
  if(!d.from||!d.to||d.from===d.to) return null;
  const candidateDate=parseMailDate(body)||parseMailDate(subject);
  return {from:d.from,to:d.to,flightNumber:d.flightNumber,departureLocal:candidateDate,
    source:'Gmail confirmation candidate',sourceId:email.id||null,
    confidence:d.flightNumber&&candidateDate?'medium':'low'};
}

function airportUtc(local,airport){
 const zone=ZONES[airport];if(!local||!zone)return null;
 const guess=Date.parse(local+':00Z');if(!Number.isFinite(guess))return null;
 let t=guess;
 for(let i=0;i<2;i++){
   const apparent=airportLocalISO(new Date(t).toISOString(),airport);
   if(!apparent)return null;
   const delta=Date.parse(apparent+':00Z')-guess;
   t-=delta;
 }
 return new Date(t).toISOString();
}
function clock12(s){
 const m=s.match(/(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)/i);if(!m)return null;
 return String(Number(m[1])%12+(m[3].toUpperCase()==='PM'?12:0)).padStart(2,'0')+':'+m[2];
}
function datedBlock(block){
 const m=block.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d\d)\b/i);
 if(!m)return null;return m[3]+'-'+String(MONTHS[m[1].slice(0,3).toLowerCase()]).padStart(2,'0')+'-'+m[2].padStart(2,'0');
}
export function mailSegments(email){
 const body=String(email.body||'').replace(/\r/g,'').slice(0,50000);
 if(!/flight\s+to\s+/i.test(body))return [];
 const pieces=body.split(/(?=^Flight\s+to\s+)/gmi);
 const found=[];
 for(const piece of pieces){
   if(!/^\s*Flight\s+to\s+/i.test(piece))continue;
   const excerpt=piece.slice(0,1500),day=datedBlock(excerpt);
   const standalone=excerpt.split('\n').map(x=>x.trim()).filter(x=>/^[A-Z]{3}$/.test(x)&&AIRPORTS.has(x));
   const d=details(excerpt);
   const from=standalone[0]||d.from,to=standalone.find(x=>x!==from)||d.to;
   const flightNumber=d.flightNumber;
   const row=excerpt.match(/\b(\d{1,2}:[0-5]\d\s*[AP]M)\s+(\d{1,2}:[0-5]\d\s*[AP]M)\b/i);
   if(!day||!from||!to||from===to||!row||!flightNumber)continue;
   const startLocal=day+'T'+clock12(row[1]);
   const departure=airportUtc(startLocal,from);
   if(!departure)continue;
   const duration=excerpt.match(/\b(\d{1,2})\s*h(?:\s*(\d{1,2})\s*m)?\b/i);
   const minutes=duration?Number(duration[1])*60+Number(duration[2]||0):null;
   const arrival=minutes&&minutes>=20&&minutes<=1500?new Date(Date.parse(departure)+minutes*60000).toISOString():null;
   const arrivalLocal=arrival?airportLocalISO(arrival,to):null;
   found.push({id:'gmail-'+String(email.id||'mail')+'-'+found.length,from,to,flightNumber,
     departure,arrival,departureLocal:startLocal,arrivalLocal,
     source:'Gmail confirmation',evidence:['gmail'],
     confidence:arrival?'high':'medium',sourceUrl:null});
 }
 return found;
}

function sameFlight(a,b){
  if(a.from!==b.from||a.to!==b.to)return false;
  const diff=Math.abs(Date.parse(a.departure)-Date.parse(b.departure));
  return Number.isFinite(diff)&&diff<6*60*60*1000&&(!a.flightNumber||!b.flightNumber||a.flightNumber===b.flightNumber);
}
export function buildTrips(segments,mail=[],home='DEN',now=new Date()) {
  const fresh=(segments||[]).filter(s=>s?.departure && Date.parse(s.departure)>=now.getTime()-8*60*60*1000).sort((a,b)=>Date.parse(a.departure)-Date.parse(b.departure));
  const unique=[];
  for(const s of fresh){
   const previous=unique.find(u=>sameFlight(u,s));
   if(previous){previous.evidence=[...new Set([...(previous.evidence||[]),...(s.evidence||[])])];continue}
   unique.push({...s});
 }
  for(const s of unique){
    const e=mail.find(m=>m.from===s.from&&m.to===s.to&&(!m.flightNumber||!s.flightNumber||m.flightNumber===s.flightNumber)&&(!m.departureLocal||m.departureLocal.slice(0,10)===s.departureLocal?.slice(0,10)));
    if(e) s.evidence=[...new Set([...(s.evidence||[]),'gmail'])];
  }
  const trips=[];let current=null;
  for(const s of unique){
    const last=current?.segments.at(-1),gap=last?(Date.parse(s.departure)-Date.parse(last.departure))/86400000:Infinity;
    const continuous=last && last.to===s.from && gap>=0 && gap<=45 && last.to!==home;
    if(!current || !continuous){current={id:'trip-'+trips.length,segments:[]};trips.push(current)}
    current.segments.push(s);
    if(s.to===home) current=null;
  }
  return trips.filter(t=>t.segments.length).map(t=>{
    const first=t.segments[0], last=t.segments.at(-1);
    return {...t,id:first.id||t.id,start:first.departure,returnArrival:last.to===home?last.arrival:null,
      homeAirport:home,origin:first.from,destination:first.to,
      outbound:t.segments.find(s=>s.from===home)||first,
      inbound:[...t.segments].reverse().find(s=>s.to===home)||null,
      itineraryComplete:t.segments[0].from===home && last.to===home,
      gmailCorroborated:t.segments.some(s=>s.evidence?.includes('gmail'))};
  }).filter(t=>t.outbound && (!home||t.origin===home)).slice(0,8);
}
export const DEMO_TRIPS=[{
 id:'fictional-demo',start:'2026-11-20T09:25:00-07:00',homeAirport:'DEN',origin:'DEN',destination:'SEA',itineraryComplete:true,gmailCorroborated:true,
 segments:[
  {id:'sample-out',from:'DEN',to:'SEA',flightNumber:'DEMO 101',departure:'2026-11-20T09:25:00-07:00',arrival:'2026-11-20T11:25:00-08:00',departureLocal:'2026-11-20T09:25',arrivalLocal:'2026-11-20T11:25',source:'Fictional demo',confidence:'high',evidence:['demo']},
  {id:'sample-back',from:'SEA',to:'DEN',flightNumber:'DEMO 102',departure:'2026-11-23T14:20:00-08:00',arrival:'2026-11-23T17:55:00-07:00',departureLocal:'2026-11-23T14:20',arrivalLocal:'2026-11-23T17:55',source:'Fictional demo',confidence:'high',evidence:['demo']}
 ],
 outbound:{from:'DEN',to:'SEA',flightNumber:'DEMO 101',departure:'2026-11-20T09:25:00-07:00',arrival:'2026-11-20T11:25:00-08:00',departureLocal:'2026-11-20T09:25',arrivalLocal:'2026-11-20T11:25'},
 inbound:{from:'SEA',to:'DEN',flightNumber:'DEMO 102',departure:'2026-11-23T14:20:00-08:00',arrival:'2026-11-23T17:55:00-07:00',departureLocal:'2026-11-23T14:20',arrivalLocal:'2026-11-23T17:55'}
}];
