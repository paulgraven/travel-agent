
const AIRPORTS = new Set(('DEN MSP HPN JFK LGA EWR BOS PHL BWI DCA IAD ORD MDW DTW CLE CMH CVG IND MCI STL BNA ATL CLT RDU RIC CHS SAV MCO TPA MIA FLL PBI JAX MSY AUS DFW DAL IAH HOU SAT OKC TUL ABQ PHX LAS SLC BOI SEA PDX SFO SJC OAK SMF LAX BUR SNA ONT SAN PSP HNL OGG LIH KOA ANC YYZ YVR YUL CUN LHR LGW CDG AMS FRA MUC DUB FCO MAD BCN LIS NRT HND ICN GRU MEX').split(' '));
const AIRLINES = {United:'UA',Delta:'DL',Southwest:'WN',American:'AA',Alaska:'AS',JetBlue:'B6',Frontier:'F9',Spirit:'NK'};
const MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const normal = s => String(s || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const codes = text => [...new Set((text.match(/\b[A-Z]{3}\b/g)||[]).filter(c=>AIRPORTS.has(c)))];
export const localISO = value => typeof value==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(value) ? value.slice(0,16) : null;
function details(text) {
  const raw = normal(text);
  const explicit = raw.match(/\b([A-Z]{3})\s*(?:→|->|to|–|-|\/)\s*([A-Z]{3})\b/i);
  const hits = codes(raw);
  const from = explicit && AIRPORTS.has(explicit[1].toUpperCase()) ? explicit[1].toUpperCase() : hits[0] || null;
  const to = explicit && AIRPORTS.has(explicit[2].toUpperCase()) ? explicit[2].toUpperCase() : hits.find(c=>c!==from) || null;
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
  const d=details(text);
  if (!d.from || !d.to || d.from===d.to) return null;
  return {id:String(e.id||summary),from:d.from,to:d.to,flightNumber:d.flightNumber,
    departure:e.start.dateTime,arrival:e.end?.dateTime||null,
    departureLocal:localISO(e.start.dateTime),arrivalLocal:localISO(e.end?.dateTime),
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
  const d=details(subject+' '+body);
  if(!d.from||!d.to||d.from===d.to) return null;
  const candidateDate=parseMailDate(body)||parseMailDate(subject);
  return {from:d.from,to:d.to,flightNumber:d.flightNumber,departureLocal:candidateDate,
    source:'Gmail confirmation candidate',sourceId:email.id||null,
    confidence:d.flightNumber&&candidateDate?'medium':'low'};
}
function sameFlight(a,b){
  if(a.from!==b.from||a.to!==b.to)return false;
  const diff=Math.abs(Date.parse(a.departure)-Date.parse(b.departure));
  return Number.isFinite(diff)&&diff<6*60*60*1000&&(!a.flightNumber||!b.flightNumber||a.flightNumber===b.flightNumber);
}
export function buildTrips(segments,mail=[],home='DEN',now=new Date()) {
  const fresh=(segments||[]).filter(s=>s?.departure && Date.parse(s.departure)>=now.getTime()-8*60*60*1000).sort((a,b)=>Date.parse(a.departure)-Date.parse(b.departure));
  const unique=[];
  for(const s of fresh)if(!unique.some(u=>sameFlight(u,s)))unique.push({...s});
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
