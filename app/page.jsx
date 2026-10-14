
'use client';
import {useEffect,useState} from 'react';
import {signIn,signOut} from 'next-auth/react';
import {Plane,PlaneTakeoff,PlaneLanding,ArrowRight,ArrowLeft,ArrowUpRight,CalendarDays,UsersRound,UserRound,UserRoundPlus,CarFront,TrainFront,RefreshCw,ShieldCheck,CheckCircle2,Clock3,ExternalLink,MapPin,Info,ChevronDown,ChevronRight,Sparkles,Wallet,Copy,Check,SlidersHorizontal,Compass,AlertCircle,LockKeyhole,Navigation,Ticket,Globe2} from 'lucide-react';
import {DEMO_TRIPS,airportUtc} from '../lib/trips';
import {makeTimeline} from '../lib/timeline';
import {bestUserQuote} from '../lib/quotes';
const SHOWCASE=process.env.NEXT_PUBLIC_SHOWCASE_ONLY==='true';
const MODES=[{id:'solo',label:'Just me',note:'1 adult',adults:1,children:0,icon:UserRound},{id:'couple',label:'Two adults',note:'2 adults',adults:2,children:0,icon:UsersRound},{id:'family',label:'Whole family',note:'2 adults + children',adults:2,children:2,icon:UsersRound},{id:'custom',label:'Other travelers',note:'Customize group',adults:1,children:0,icon:UserRoundPlus}];
const icons={parking:CarFront,rideshare:Navigation,rtd:TrainFront};
const empty = v => v===null||v===undefined||v==='';
function localFmt(v,full=false){
 if(!v||!v.includes('T'))return 'Time unavailable';
 const [ymd,hm]=v.split('T'),[y,m,d]=ymd.split('-'),[hour,min]=hm.split(':');
 const date=new Date(Date.UTC(Number(y),Number(m)-1,Number(d)));
 const dateText=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(full?{weekday:'short'}:{}) ,timeZone:'UTC'}).format(date);
 const h=Number(hour);return dateText+' · '+String(h%12||12)+':'+min+' '+(h>=12?'pm':'am');
}
function timeFmt(v){if(!v||!v.includes('T'))return '—';const h=Number(v.slice(11,13));return String(h%12||12)+':'+v.slice(14,16)+(h>=12?'pm':'am')}
function targetTime(v,offset){
 if(!v||!v.includes('T'))return null;
 const date=new Date(v+':00Z');if(Number.isNaN(+date))return null;return date.getTime()+offset*60000;
}
function targetText(v,offset){const ts=targetTime(v,offset);if(!ts)return 'Unverified';return timeFmt(new Date(ts).toISOString().slice(0,16))}
function money(v){return !empty(v)&&Number.isFinite(Number(v))?'$'+Math.round(Number(v)).toLocaleString('en-US'):'Quote needed'}
function prettyClock(v){const m=/^(\d{1,2}):(\d{2})/.exec(v||'');if(!m)return v||'Unverified';const h=Number(m[1]);return String(h%12||12)+':'+m[2]+(h>=12?'pm':'am')}
function RoundIcon({id}){const Icon=icons[id]||CarFront;return <span className={'option-icon '+(id==='rtd'?'train':id==='rideshare'?'ride':'')}><Icon size={18}/></span>}
function Stepper({step}){return <div className="stepper" aria-label="Planning progress">{['Trip','Travelers','Compare','Your plan'].map((name,i)=><div key={name} style={{display:'contents'}}>{i>0&&<span className="step-line"/>}<div className={'stepper-item '+(step>i+1?'done':step===i+1?'active':'')}><span className="step-number">{step>i+1?<Check size={14}/>:i+1}</span>{name}</div></div>)}</div>}
function SectionTitle({icon:Icon,title,note}){return <div className="section-heading"><span className="section-icon"><Icon size={19}/></span><div><h2>{title}</h2>{note&&<p>{note}</p>}</div></div>}
function FlightCard({trip,demo}){return <div className="simple-flights">{demo&&<p className="tiny">Fictional example · No bookings</p>}{[trip.outbound,trip.inbound].filter(Boolean).map((flight,i)=><div className="simple-flight" key={i}><strong>{flight.from} → {flight.to}</strong><p>{localFmt(flight.departureLocal,true)}{flight.arrivalLocal?'–'+timeFmt(flight.arrivalLocal):''} · {flight.flightNumber||'Flight number unavailable'}</p></div>)}</div>}
function SummaryTimeline({trip,departureLocal,arrivalLocal,selected,children,rtd,driveMinutes,traffic}){
 const plan=makeTimeline({outboundLocal:departureLocal,inboundLocal:arrivalLocal,mode:selected,children,driveMinutes:driveMinutes||null,rtd,traffic});
 return <div>{[['Outbound',plan.outbound],['Return',plan.inbound]].map(([title,rows])=><section className="simple-schedule" key={title}><h3>{title} · {title==='Outbound'?trip.outbound.from+' → '+trip.outbound.to:trip.inbound?.from+' → '+trip.inbound?.to}</h3><table><thead><tr><th>Time</th><th>Action</th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}><td>{row.time}</td><td>{row.action}</td></tr>)}</tbody></table></section>)}<p className="tiny">{selected==='rtd'?(plan.pair?.verifiedPublishedTimes?'Published RTD times verified; date-specific disruptions remain unverified.':rtd?.error||'Checking RTD timetable…'):'Times are planning estimates.'} Lounge time depends on security and eligibility. No bookings.</p></div>;
}
export default function Home(){
 const [mode,setMode]=useState(SHOWCASE?'demo':'welcome'),[trips,setTrips]=useState(SHOWCASE?DEMO_TRIPS:[]),[selected,setSelected]=useState(SHOWCASE?DEMO_TRIPS[0]:null),[step,setStep]=useState(2);
 const [traveler,setTraveler]=useState('solo'),[adults,setAdults]=useState(1),[children,setChildren]=useState(0),[district,setDistrict]=useState('in'),[home,setHome]=useState('DEN'),[origin,setOrigin]=useState('');
 const [departureLocal,setDepartureLocal]=useState(SHOWCASE?DEMO_TRIPS[0].outbound.departureLocal:''),[arrivalLocal,setArrivalLocal]=useState(SHOWCASE?DEMO_TRIPS[0].inbound.arrivalLocal:''),[editTimes,setEditTimes]=useState(false);
 const [manual,setManual]=useState(false),[manualFrom,setManualFrom]=useState('DEN'),[manualTo,setManualTo]=useState('SEA');
 const [transport,setTransport]=useState(null),[selectedTransport,setSelectedTransport]=useState(''),[rtd,setRtd]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notes,setNotes]=useState([]);
 const [traffic,setTraffic]=useState(null),[trafficBusy,setTrafficBusy]=useState(false),[driveMinutes,setDriveMinutes]=useState(''),[uberQuote,setUberQuote]=useState(''),[lyftQuote,setLyftQuote]=useState(''),[quote,setQuote]=useState(''),[copied,setCopied]=useState(false),[otherTrips,setOtherTrips]=useState(false);
 const [connected,setConnected]=useState(false),[reconnect,setReconnect]=useState(false);
 const sample=mode==='demo';
 const login=()=>signIn('google',{callbackUrl:'/'},reconnect?{prompt:'consent'}:{});
 const airport=selected?.outbound?.from||manualFrom||home;
 useEffect(()=>{
  if(SHOWCASE)return;if(new URLSearchParams(location.search).get('demo')==='1'){demoMode();return}
  fetch('/api/auth/session',{cache:'no-store'}).then(r=>r.json()).then(s=>{if(s?.user){setConnected(true);setMode('live');loadTrips('DEN')}}).catch(()=>{});
 },[]);
 function setTrip(t){
  setTraffic(null);setDriveMinutes('');setQuote('');setUberQuote('');setLyftQuote('');setSelected(t);setDepartureLocal(t.outbound?.departureLocal||'');setArrivalLocal(t.inbound?.arrivalLocal||'');setSelectedTransport('');setTransport(null);setStep(2);setOtherTrips(false);setEditTimes(!t.inbound);
 }
 async function loadTrips(which=home){
  if(SHOWCASE)return;setBusy(true);setError('');
  try{const response=await fetch('/api/flights?home='+encodeURIComponent(which),{cache:'no-store'});const data=await response.json();
   if(!response.ok){if(response.status===401||response.status===403)setReconnect(true);throw Error(data.error||'Could not read Google flights');}
   setNotes(data.warnings||[]);setTrips(data.trips||[]);setMode('live');
   if(data.trips?.length){setTrip(data.trips[0]);setManual(false)}else{setSelected(null);setManual(true);setStep(1)}
  }catch(e){setError(e.message);setMode('live');setTrips([]);setSelected(null);setManual(true);setStep(1)}
  finally{setBusy(false)}
 }
 function demoMode(){setMode('demo');setNotes([]);setError('');setTrips(DEMO_TRIPS);setManual(false);setTrip(DEMO_TRIPS[0]);setOrigin('Central Denver, CO')}
 function liveMode(){setMode('live');setOrigin('');loadTrips()}
 function createManual(){
  if(!departureLocal||!arrivalLocal||!/^[A-Z]{3}$/.test(manualFrom)||!/^[A-Z]{3}$/.test(manualTo)||Date.parse(arrivalLocal)<=Date.parse(departureLocal)){setError('Enter valid airport codes and both departure and return times.');return}
  const first={id:'man-out',from:manualFrom.toUpperCase(),to:manualTo.toUpperCase(),flightNumber:null,departure:departureLocal,departureLocal,arrival:null,arrivalLocal:null,source:'Manual'};
  const back={id:'man-back',from:manualTo.toUpperCase(),to:manualFrom.toUpperCase(),flightNumber:null,departure:arrivalLocal,departureLocal:arrivalLocal,arrival:arrivalLocal,arrivalLocal,source:'Manual'};
  setSelected({id:'manual',segments:[first,back],outbound:first,inbound:back,origin:first.from,destination:first.to,start:first.departure,itineraryComplete:false,gmailCorroborated:false});setError('');setManual(false)
 }
 function saveTravelers(){if(traveler==='custom'&&(!Number.isInteger(adults)||adults<1||adults>12||!Number.isInteger(children)||children<0||children>12)){setError('Check the number of adults and children.');return}if(Date.parse(arrivalLocal)<=Date.parse(departureLocal)){setError('Return arrival must be after departure.');return}if(!arrivalLocal||!departureLocal){setError('Confirm the departure and return times before comparing transportation.');setStep(2);setEditTimes(true);return}const opt=MODES.find(x=>x.id===traveler);if(traveler!=='custom'){setAdults(opt.adults);setChildren(opt.children)}setStep(3);loadComparison(traveler==='custom'?adults:opt.adults)}
 async function loadComparison(adultCount=adults,districtValue=district){
  setBusy(true);setError('');setSelectedTransport('');
  try{const out=selected?.outbound?.departure||departureLocal,back=selected?.inbound?.arrival||arrivalLocal;
   const useOut=editTimes||manual||selected?.id==='manual'?airportUtc(departureLocal,airport):out,useBack=editTimes||manual||selected?.id==='manual'?airportUtc(arrivalLocal,airport):back;
   const params=new URLSearchParams({outboundFlight:useOut||'',inboundArrival:useBack||'',airport:airport||'DEN',adults:String(adultCount),district:'in'});
   const response=await fetch('/api/transport?'+params,{cache:'no-store'});if(!response.ok)throw Error('Pricing information is temporarily unavailable');
   setTransport(await response.json());
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function chooseTransport(id){
  if(airport!=='DEN'){setError('Verified transportation planning currently supports DEN. Local airport sources are not configured.');return}
  setSelectedTransport(id);setStep(4);setRtd(null);setTraffic(null);setDriveMinutes('');
  if(id==='rtd'&&airport==='DEN'&&departureLocal&&arrivalLocal){
   try{const qs=new URLSearchParams({outboundDate:departureLocal.slice(0,10),returnDate:arrivalLocal.slice(0,10)});
    const r=await fetch('/api/rtd?'+qs,{cache:'no-store'});setRtd(await r.json());
   }catch{setRtd({error:'The RTD timetable could not be checked.'})}
  }
  
 }
 async function checkTraffic(){
  if(!origin.trim()){setError('Enter your starting address to check traffic.');return}
  setTrafficBusy(true);setError('');setTraffic(null);
  try{const r=await fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin,destination:selectedTransport==='rtd'?'station':'airport'})});const data=await r.json();setTraffic(data);if(data.available)setDriveMinutes(String(data.minutes));else setError(data.reason||data.error||'Traffic unavailable.')}catch{setError('Traffic could not be checked.')}finally{setTrafficBusy(false)}
 }
 async function copyPlan(){
  const t=selected;if(!t)return;
  const plan=makeTimeline({outboundLocal:departureLocal,inboundLocal:arrivalLocal,mode:selectedTransport,children,driveMinutes:driveMinutes||null,rtd,traffic});
  const content=['Travel plan',t.segments.map(s=>s.from+' → '+s.to+' '+(s.flightNumber||'')+' '+localFmt(s.departureLocal)).join('\n'),'Travelers: '+adults+' adults, '+children+' children','Transport: '+(transport?.rows?.find(x=>x.id===selectedTransport)?.option||selectedTransport),'Outbound',...plan.outbound.map(r=>r.time+' · '+r.action),'Return',...plan.inbound.map(r=>r.time+' · '+r.action),rtd?.warning||'Times are planning estimates. No bookings made.'].join('\n');

  try{await navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2500)}catch{}
 }
 const bestQuote=bestUserQuote(uberQuote,lyftQuote);
 const picked=transport?.rows?.find(x=>x.id===selectedTransport);
 const displayedCost=selectedTransport==='rideshare'&&bestQuote?bestQuote.amount:Number(quote)>0?Number(quote):picked?.amount;
 const isDemoTrip=sample || SHOWCASE;
 return <main className="simple-app">
  <header className="simple-header"><a className="simple-brand" href="/"><Compass size={22}/> Personal Travel Agent</a>{connected&&<button className="simple-link" onClick={()=>signOut({callbackUrl:'/'})}>Sign out</button>}</header>
  <div className="simple-card">
   {mode==='welcome'?<section className="simple-welcome"><PlaneTakeoff size={32}/><h1>Your airport trip, sorted.</h1><p>Connect Google. Choose who's traveling. Pick your ride.</p><button className="btn btn-primary" onClick={login}>Continue with Google</button><p className="tiny">Read-only Calendar access. No email access or automatic bookings.</p><button className="simple-link" onClick={demoMode}>Try an example</button></section>:<>
   {busy&&!selected?<p role="status">Finding your upcoming flights…</p>:selected&&<FlightCard trip={selected} demo={sample}/>}
   {error&&<p className="simple-error" role="alert">{error} {reconnect&&<button className="simple-link" onClick={login}>Reconnect Google</button>}</p>}
   {!selected&&!busy&&<><h2>No upcoming flights found.</h2><p>Add your trip below, or check Calendar again.</p>{connected&&<button className="simple-link" onClick={()=>loadTrips()}>Refresh Calendar</button>}</>}
   {(manual||editTimes)&&<details open={!departureLocal||!arrivalLocal||manual} className="simple-details"><summary>{manual?'Add a trip':'Confirm flight times'}</summary>{manual&&<div className="fields"><label className="fieldgroup">From<input className="field" maxLength={3} value={manualFrom} onChange={e=>setManualFrom(e.target.value.toUpperCase())}/></label><label className="fieldgroup">To<input className="field" maxLength={3} value={manualTo} onChange={e=>setManualTo(e.target.value.toUpperCase())}/></label></div>}<div className="fields"><label className="fieldgroup">Flight departure<input className="field" type="datetime-local" value={departureLocal} onChange={e=>setDepartureLocal(e.target.value)}/></label><label className="fieldgroup">Return arrival<input className="field" type="datetime-local" value={arrivalLocal} onChange={e=>setArrivalLocal(e.target.value)}/></label></div>{manual&&<button className="btn btn-primary" onClick={()=>{createManual();setStep(2)}}>Continue</button>}</details>}
   {selected&&step===2&&<section><h2>Who's traveling?</h2><div className="simple-choices" role="radiogroup" aria-label="Travelers">{MODES.map(t=><label key={t.id} className={'simple-choice '+(traveler===t.id?'active':'')}><input type="radio" name="travelers" checked={traveler===t.id} onChange={()=>{setTraveler(t.id);if(t.id!=='custom'){setAdults(t.adults);setChildren(t.children)}}}/>{t.label}</label>)}</div>{traveler==='custom'&&<div className="fields"><label className="fieldgroup">Adults<input className="field" type="number" min={1} max={12} value={adults} onChange={e=>setAdults(Number(e.target.value))}/></label><label className="fieldgroup">Children<input className="field" type="number" min={0} max={12} value={children} onChange={e=>setChildren(Number(e.target.value))}/></label></div>}<button className="btn btn-primary" onClick={saveTravelers}>Continue transportation planning <ArrowRight size={16}/></button></section>}
   {selected&&step===3&&<section><h2>Choose transportation</h2>{children>0&&<p className="tiny">{children} car seat{children===1?'':'s'}, stroller and checked bags. XL or larger.</p>}{busy?<p role="status">Checking transportation options…</p>:transport&&<><div className="simple-table-wrap"><table className="simple-compare"><thead><tr><th>Option</th><th>Est. round-trip cost</th><th>Est. time</th><th>Convenience</th></tr></thead><tbody>{transport.rows.map(row=><tr key={row.id}><td><button className="simple-link option-link" onClick={()=>chooseTransport(row.id)}>{row.option}</button></td><td>{money(row.id==='rideshare'&&bestQuote?bestQuote.amount:row.amount)}</td><td>{row.time||'Unverified'}</td><td>{row.convenience}</td></tr>)}</tbody></table></div><p className="tiny">One-way travel estimates. Published parking/train rates; rideshare fares {bestQuote?'entered by you':'unavailable'}. {transport.rateVerification?.allVerified?'Official rates checked.':'Current rates could not all be reverified.'}</p><p><strong>Recommendation:</strong> {children>0?'DEN Economy for convenience; RTD for savings.':'Compare parking and RTD costs; verify a rideshare quote before choosing.'}</p><div className="simple-choices">{transport.rows.map(row=><button className="btn" key={row.id} onClick={()=>chooseTransport(row.id)}>{row.option}</button>)}</div><details className="simple-details"><summary>Check Uber / Lyft quotes</summary><p className="tiny">Enter each provider's total for both trips. These are user-entered quotes.</p><div className="fields"><label className="fieldgroup">Uber round trip ($)<input className="field" type="number" min={0} value={uberQuote} onChange={e=>setUberQuote(e.target.value)}/></label><label className="fieldgroup">Lyft round trip ($)<input className="field" type="number" min={0} value={lyftQuote} onChange={e=>setLyftQuote(e.target.value)}/></label></div><a className="simple-link" target="_blank" rel="noreferrer" href="https://m.uber.com/looking">Open Uber</a> · <a className="simple-link" target="_blank" rel="noreferrer" href="https://www.lyft.com/rider">Open Lyft</a></details></>}
   <button className="simple-link" onClick={()=>setStep(2)}>Change travelers</button></section>}
   {selected&&step===4&&<section><h2>{picked?.option||'Your travel plan'}</h2><SummaryTimeline trip={selected} departureLocal={departureLocal} arrivalLocal={arrivalLocal} selected={selectedTransport} children={children} rtd={rtd} driveMinutes={driveMinutes} traffic={traffic}/><p><strong>Est. round-trip cost: {money(displayedCost)}</strong></p><div className="simple-actions"><button className="btn btn-primary" onClick={copyPlan}>{copied?'Copied':'Copy plan'}</button><button className="btn" onClick={()=>setStep(3)}>Change transportation</button></div><details className="simple-details"><summary>Set departure point / driving time</summary><label className="fieldgroup">Starting address<input className="field" value={origin} onChange={e=>{setOrigin(e.target.value);setTraffic(null);setDriveMinutes('')}}/></label><label className="fieldgroup">Estimated drive minutes<input className="field" type="number" min={1} max={300} value={driveMinutes} onChange={e=>{setDriveMinutes(e.target.value);setTraffic(null)}}/></label>{!SHOWCASE&&<button className="btn" onClick={checkTraffic} disabled={trafficBusy}>{trafficBusy?'Checking…':'Check traffic with Google Maps'}</button>}<p className="tiny">Traffic check sends only your address and destination to Google Maps.</p></details></section>}
   {selected&&<details className="simple-details"><summary>Trip settings</summary><button className="simple-link" onClick={()=>setEditTimes(!editTimes)}>Correct flight times</button>{trips.length>1&&trips.map(t=><button key={t.id} className="simple-link trip-link" onClick={()=>setTrip(t)}>{t.outbound.from} → {t.outbound.to} · {localFmt(t.outbound.departureLocal)}</button>)}{connected&&<><label className="fieldgroup">Home airport<input className="field" maxLength={3} value={home} onChange={e=>setHome(e.target.value.toUpperCase())}/></label><button className="simple-link" onClick={()=>loadTrips()}>Refresh Calendar</button></>}{sample&&!SHOWCASE&&<button className="simple-link" onClick={login}>Connect my Google Calendar</button>}</details>}
   </>}
  </div>
  <footer className="simple-footer"><a href="/privacy">Privacy</a><span>No automatic bookings.</span></footer>
 </main>;
}
