
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Plane,PlaneTakeoff,PlaneLanding,ArrowRight,ArrowLeft,ArrowUpRight,CalendarDays,UsersRound,UserRound,UserRoundPlus,CarFront,TrainFront,RefreshCw,ShieldCheck,CheckCircle2,Clock3,ExternalLink,MapPin,Info,ChevronDown,ChevronRight,Sparkles,Wallet,Copy,Check,SlidersHorizontal,Compass,AlertCircle,LockKeyhole,Navigation,Ticket,Globe2} from 'lucide-react';
import {DEMO_TRIPS} from '../lib/trips';
import {selectTrainPair} from '../lib/planner';
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
function FlightCard({trip,demo}){const out=trip.outbound||trip.segments[0],back=trip.inbound;return <div className="flight-card">
 <div className="trip-head"><span className="tag"><CheckCircle2 size={14}/>{demo?'Fictional example':trip.gmailCorroborated?'Calendar + Gmail match':'Calendar itinerary'}</span><span className="chip">{trip.segments.length} flight segment{trip.segments.length===1?'':'s'}</span></div>
 <div className="trip-route"><div><div className="airport">{out.from||'???'}</div><span className="tiny">Departure</span></div><span className="route-arrow"><Plane size={23}/></span><div style={{textAlign:'right'}}><div className="airport">{out.to||'???'}</div><span className="tiny">Destination</span></div></div>
 <div className="flight-meta"><div><CalendarDays size={14} style={{verticalAlign:'middle',marginRight:5}}/> {localFmt(out.departureLocal,true)}</div><div><strong>{back?localFmt(back.arrivalLocal||back.departureLocal,true):'Return not detected'}</strong></div></div>
 <div className="segment-list">{trip.segments.slice(0,5).map((s,i)=><div className="segment-row" key={s.id||i}><Plane size={15}/><strong>{s.from} → {s.to}</strong> <span className="muted">{s.flightNumber||'Flight number unavailable'}</span><span className="time">{timeFmt(s.departureLocal)}</span></div>)}</div>
 </div>}
function SummaryTimeline({trip,departureLocal,arrivalLocal,selected,travelers,rtd,demo,origin}){
 const isTrain=selected==='rtd',family=travelers==='family';
 const target=targetText(departureLocal,family?-150:-120),earliest=targetText(arrivalLocal,family?60:45);
 const chosen=rtd?.verified&&rtd.outbound&&rtd.return?selectTrainPair({outboundSchedule:rtd.outbound.centralParkToDEN,returnSchedule:rtd.return.denToCentralPark,outboundLocal:departureLocal,inboundLocal:arrivalLocal,travelers:travelers}):null;
 const fullDeparture=departureLocal?localFmt(departureLocal,true):'Not known',fullArrival=arrivalLocal?localFmt(arrivalLocal,true):'Not known';
 const title = selected==='rtd'?'Central Park A Line':selected==='parking'?'DEN Economy parking':'Uber / Lyft XL';
 const mapsURL='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin||'Denver, CO')+'&destination='+encodeURIComponent('Denver International Airport')+'&travelmode=driving';
 const parts=[
  {title:'Departure day',rows:[
   {title:isTrain?(chosen?.outbound?'Board the A Line at Central Park':'Choose an outbound A Line train'):'Leave for the airport',note:isTrain?(chosen?.outbound?prettyClock(chosen.outbound.departCentralPark)+' · published RTD time':'Select a train that arrives at DEN before '+target+'.'): 'Check travel time from your address. '+(selected==='parking'?'Allow time to park and reach the terminal.':'Check pickup, luggage and car seats.')},
   {title:isTrain?(chosen?.outbound?'Arrive at DEN Station':'Recommended airport arrival'):'Aim to reach DEN by',note:isTrain&&chosen?.outbound?prettyClock(chosen.outbound.arriveDEN)+' · published RTD time':target+' · planning target, not a verified journey time'},
   {title:'Flight departs',note:fullDeparture+' · '+(trip?.outbound?.flightNumber||'flight')}
  ]},
  {title:'Return day',rows:[
   {title:'Flight arrives',note:fullArrival},
   {title:isTrain?(chosen?.inbound?'Board the A Line at DEN':'Earliest recommended train'):'Collect luggage / exit airport',note:isTrain?(chosen?.inbound?prettyClock(chosen.inbound.departDEN)+' · published RTD time':earliest+' or later · exact train unverified'):'Allow at least '+(family?'60':'45')+' minutes for deplaning and baggage.'},
   {title:isTrain?(chosen?.inbound?'Arrive at Central Park':'Return home'):'Return home',note:isTrain?(chosen?.inbound?prettyClock(chosen.inbound.arriveCentralPark)+' · published RTD time':'Train times not yet verified.'):'Allow time for '+(selected==='parking'?'economy parking shuttle and driving.':'your ride pickup and driving.')}
  ]}
 ];
 return <div>
  <div className="inline-controls" style={{marginBottom:16}}><div><strong style={{fontSize:17}}>{title}</strong><p className="sub">Flight-aware planning · one selected option</p></div><span className={'support-badge '+(isTrain&&chosen?.verifiedPublishedTimes?'':'neutral')}>{isTrain&&chosen?.verifiedPublishedTimes?'Published RTD times':'Planning targets'}</span></div>
  {demo&&<div className="notice warning"><Info/> Fictional flights. Timing targets illustrate the workflow and are not real travel recommendations.</div>}
  <div className="schedule-columns">{parts.map((part,i)=><div className="schedule-panel" key={i}><h3>{part.title}</h3><div className="timeline">{part.rows.map((e,j)=><div className="timeline-event" key={j}><h4>{e.title}</h4><p>{e.note}</p></div>)}</div></div>)}</div>
  {isTrain&&(!chosen?.verifiedPublishedTimes)&&<div className="notice warning"><AlertCircle size={16}/><span>{rtd?.error||'Exact date-specific A Line departures could not be verified.'} <a href="https://app.rtd-denver.com/route/A/schedule" target="_blank" rel="noreferrer">Check official RTD schedule <ArrowUpRight size={12}/></a></span></div>}
  {!isTrain&&<div className="notice"><Clock3/><span>Home departure and arrival times require a current driving estimate. <a target="_blank" rel="noreferrer" href={mapsURL}>Check driving route <ArrowUpRight size={12}/></a></span></div>}
 </div>;
}
export default function Home(){
 const [mode,setMode]=useState('demo'),[trips,setTrips]=useState(DEMO_TRIPS),[selected,setSelected]=useState(DEMO_TRIPS[0]),[step,setStep]=useState(1);
 const [traveler,setTraveler]=useState('solo'),[adults,setAdults]=useState(1),[children,setChildren]=useState(0),[district,setDistrict]=useState('in'),[home,setHome]=useState('DEN'),[origin,setOrigin]=useState('');
 const [departureLocal,setDepartureLocal]=useState(DEMO_TRIPS[0].outbound.departureLocal),[arrivalLocal,setArrivalLocal]=useState(DEMO_TRIPS[0].inbound.arrivalLocal),[editTimes,setEditTimes]=useState(false);
 const [manual,setManual]=useState(false),[manualFrom,setManualFrom]=useState('DEN'),[manualTo,setManualTo]=useState('SEA');
 const [transport,setTransport]=useState(null),[selectedTransport,setSelectedTransport]=useState(''),[rtd,setRtd]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notes,setNotes]=useState([]);
 const [quote,setQuote]=useState(''),[copied,setCopied]=useState(false),[otherTrips,setOtherTrips]=useState(false);
 const sample=mode==='demo',canLive=!SHOWCASE;
 const airport=selected?.outbound?.from||manualFrom||home;
 useEffect(()=>{
  if(SHOWCASE||new URLSearchParams(location.search).get('demo')==='1')return;
  fetch('/api/auth/session',{cache:'no-store'}).then(r=>r.json()).then(s=>{if(s?.user){setMode('live');loadTrips('DEN')}}).catch(()=>{});
 },[]);
 function setTrip(t){
  setSelected(t);setDepartureLocal(t.outbound?.departureLocal||'');setArrivalLocal(t.inbound?.arrivalLocal||'');setSelectedTransport('');setTransport(null);setStep(1);setOtherTrips(false);setEditTimes(!t.inbound);
 }
 async function loadTrips(which=home){
  if(SHOWCASE)return;setBusy(true);setError('');
  try{const response=await fetch('/api/flights?home='+encodeURIComponent(which),{cache:'no-store'});const data=await response.json();
   if(!response.ok)throw Error(data.error||'Could not read Google flights');
   setNotes(data.warnings||[]);setTrips(data.trips||[]);setMode('live');
   if(data.trips?.length){setTrip(data.trips[0]);setManual(false)}else{setSelected(null);setManual(true);setStep(1)}
  }catch(e){setError(e.message);setMode('live');setTrips([]);setSelected(null);setManual(true);setStep(1)}
  finally{setBusy(false)}
 }
 function demoMode(){setMode('demo');setNotes([]);setError('');setTrips(DEMO_TRIPS);setManual(false);setTrip(DEMO_TRIPS[0]);setOrigin('Central Denver, CO')}
 function liveMode(){setMode('live');setOrigin('');loadTrips()}
 function createManual(){
  if(!departureLocal||!arrivalLocal||manualFrom.length!==3||manualTo.length!==3){setError('Enter valid airport codes and both departure and return times.');return}
  const first={id:'man-out',from:manualFrom.toUpperCase(),to:manualTo.toUpperCase(),flightNumber:null,departure:departureLocal,departureLocal,arrival:null,arrivalLocal:null,source:'Manual'};
  const back={id:'man-back',from:manualTo.toUpperCase(),to:manualFrom.toUpperCase(),flightNumber:null,departure:arrivalLocal,departureLocal:arrivalLocal,arrival:arrivalLocal,arrivalLocal,source:'Manual'};
  setSelected({id:'manual',segments:[first,back],outbound:first,inbound:back,origin:first.from,destination:first.to,start:first.departure,itineraryComplete:false,gmailCorroborated:false});setError('');setManual(false)
 }
 function saveTravelers(){if(!arrivalLocal||!departureLocal){setError('Confirm the departure and return times before comparing transportation.');setStep(1);setEditTimes(true);return}const opt=MODES.find(x=>x.id===traveler);if(traveler!=='custom'){setAdults(opt.adults);setChildren(opt.children)}setStep(3);loadComparison(traveler==='custom'?adults:opt.adults)}
 async function loadComparison(adultCount=adults,districtValue=district){
  setBusy(true);setError('');setSelectedTransport('');
  try{const out=selected?.outbound?.departure||departureLocal,back=selected?.inbound?.arrival||arrivalLocal;
   const useOut=editTimes||manual?departureLocal:out,useBack=editTimes||manual?arrivalLocal:back;
   const params=new URLSearchParams({outboundFlight:useOut||'',inboundArrival:useBack||'',airport:airport||'DEN',adults:String(adultCount),district:districtValue});
   const response=await fetch('/api/transport?'+params,{cache:'no-store'});if(!response.ok)throw Error('Pricing information is temporarily unavailable');
   setTransport(await response.json());
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function chooseTransport(id){
  setSelectedTransport(id);setStep(4);setRtd(null);
  if(id==='rtd'&&airport==='DEN'&&departureLocal&&arrivalLocal){
   try{const qs=new URLSearchParams({outboundDate:departureLocal.slice(0,10),returnDate:arrivalLocal.slice(0,10)});
    const r=await fetch('/api/rtd?'+qs,{cache:'no-store'});setRtd(await r.json());
   }catch{setRtd({error:'The RTD timetable could not be checked.'})}
  }
  
 }
 async function copyPlan(){
  const t=selected;if(!t)return;
  const content=['Travel plan',t.segments.map(s=>s.from+' → '+s.to+' '+(s.flightNumber||'')+' '+localFmt(s.departureLocal)).join('\n'),'Travelers: '+MODES.find(x=>x.id===traveler)?.label,'Transport: '+(transport?.rows?.find(x=>x.id===selectedTransport)?.option||selectedTransport),'Published-rate estimate: '+(transport?.rows?.find(x=>x.id===selectedTransport)?.amount??'not available')].join('\n');
  try{await navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2500)}catch{}
 }
 const picked=transport?.rows?.find(x=>x.id===selectedTransport);
 const displayedCost=selectedTransport==='rideshare'&&Number(quote)>0?Number(quote):picked?.amount;
 const isDemoTrip=sample || SHOWCASE;
 return <div>
  <header className="wrap topbar"><a className="brand" href={SHOWCASE?'?demo=1':'/'}><span className="brand-mark"><Compass size={21}/></span>Personal Travel Agent</a>
   <div className="header-right"><div className="header-status"><span className="status-dot"/> Interactive product demo</div>{!SHOWCASE&&<a className="header-link" href="/api/auth/signin/google">Google account</a>}<a className="header-link" href="https://github.com/paulgraven/travel-agent" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} style={{verticalAlign:'middle'}}/></a></div></header>
  <div className="wrap">
   <section className="hero"><div className="hero-copy"><span className="mini-pill"><Sparkles size={13}/> An easier way to travel</span><h1>From flight confirmation<br/>to confident departure.</h1><p>Discover your itinerary, compare the journey to the airport, and get a plan that actually makes sense.</p></div><div className="hero-art"><div className="globe"><Globe2 size={99} strokeWidth={.85}/></div><PlaneTakeoff size={43} style={{position:'absolute',transform:'rotate(-18deg) translate(30px,-15px)'}}/></div></section>
   <div className="pagegrid"><div className="maincol">
    <div className="panel"><div className="panel-top"><div><h2 className="panel-title">Plan your airport journey</h2><p className="sub">One trip at a time. No noise, no guesswork.</p></div>{!SHOWCASE&&<div className="mode-tabs"><button className={'mode-tab '+(sample?'active':'')} onClick={demoMode}><Sparkles/> Demo</button><button className={'mode-tab '+(!sample?'active':'')} onClick={liveMode}><LockKeyhole/> My flights</button></div>}</div>
     <div className="panel-body"><Stepper step={step}/>
      {sample&&<div className="demo-banner"><Info size={16}/><span>You're exploring a <strong>fictional trip</strong>. No personal Google data is used. Published transport rates illustrate the cost model.</span></div>}
      {error&&<div className="notice warning" role="alert"><AlertCircle/> {error}</div>}
      {step===1&&<section>
       <SectionTitle icon={PlaneTakeoff} title={sample?'Explore a sample trip':'Your next upcoming trip'} note={sample?'See how the assistant works with an example itinerary.':'Discovered from your connected Google Calendar and Gmail.'}/>
       {busy?<div className="empty-state"><RefreshCw size={25}/> <p>Finding relevant flights…</p></div>:
        selected&&!manual?<><FlightCard trip={selected} demo={sample}/>{!sample&&trips.length>1&&<><button className="link-button" onClick={()=>setOtherTrips(!otherTrips)}><ChevronDown size={14}/> {otherTrips?'Hide':'Show'} other trips ({trips.length-1})</button>{otherTrips&&trips.filter(t=>t.id!==selected.id).map(t=><button key={t.id} className="btn" style={{display:'block',width:'100%',textAlign:'left',marginTop:8}} onClick={()=>setTrip(t)}>{t.outbound.from} → {t.outbound.to} · {localFmt(t.outbound.departureLocal)}</button>)}</>}</>:<div className="empty-state"><PlaneTakeoff size={28}/><h3>No upcoming flight itinerary found</h3><p>You can still plan an airport trip manually, without Google data.</p><button className="btn btn-primary" onClick={()=>setManual(true)}>Add a trip</button></div>}
       {!sample&&!manual&&<div className="inline-controls" style={{marginTop:13}}><button className="link-button" onClick={()=>setManual(true)}>Enter flights manually</button><button className="link-button" onClick={()=>loadTrips()}><RefreshCw/> Refresh Google results</button></div>}
       {!sample&&<div className="fields"><label className="fieldgroup"><span className="label">Home airport</span><input className="field" maxLength={3} value={home} onChange={e=>setHome(e.target.value.toUpperCase())} onBlur={()=>{if(home.length===3)loadTrips(home)}}/></label>{notes?.length>0&&<p className="tiny" style={{flex:2,marginTop:20}}>{notes[0]}</p>}</div>}
       {manual&&<div className="flight-card"><strong>Enter your flight details</strong><div className="fields"><label className="fieldgroup"><span className="label">Flying from</span><input className="field" value={manualFrom} onChange={e=>setManualFrom(e.target.value.toUpperCase())} maxLength={3}/></label><label className="fieldgroup"><span className="label">Destination</span><input className="field" value={manualTo} onChange={e=>setManualTo(e.target.value.toUpperCase())} maxLength={3}/></label></div><div className="fields"><label className="fieldgroup"><span className="label">Outbound flight departure</span><input className="field" type="datetime-local" value={departureLocal} onChange={e=>setDepartureLocal(e.target.value)}/></label><label className="fieldgroup"><span className="label">Return flight arrival</span><input className="field" type="datetime-local" value={arrivalLocal} onChange={e=>setArrivalLocal(e.target.value)}/></label></div><button className="btn btn-primary" onClick={createManual}>Use this itinerary <ArrowRight/></button></div>}
       {selected&&!manual&&<><div className="inline-controls" style={{marginTop:13}}><span className="tiny">{selected.itineraryComplete?'Round-trip recognized':'Partial itinerary — confirm return details'}</span><button className="link-button" onClick={()=>setEditTimes(!editTimes)}><SlidersHorizontal/> {editTimes?'Hide':'Correct'} departure/return times</button></div>{editTimes&&<div className="fields"><label className="fieldgroup"><span className="label">Outbound departure · airport local</span><input className="field" type="datetime-local" value={departureLocal} onChange={e=>setDepartureLocal(e.target.value)}/></label><label className="fieldgroup"><span className="label">Return arrival · airport local</span><input className="field" type="datetime-local" value={arrivalLocal} onChange={e=>setArrivalLocal(e.target.value)}/></label></div>}</>}
       {selected&&!manual&&<div className="cta-row"><span className="tiny">You can change trips anytime.</span><button className="btn btn-primary" onClick={()=>setStep(2)}>Choose travelers <ArrowRight/></button></div>}
       {!sample&&!selected&&<div className="cta-row"><a className="btn" href="/api/auth/signin/google">Connect Google</a></div>}
      </section>}
      {step===2&&<section><SectionTitle icon={UsersRound} title="Who's traveling?" note="This helps estimate fares, luggage needs and the simplest journey."/><div className="traveler-grid">
       {MODES.map(t=>{const Icon=t.icon;return <button className={'traveler-card '+(traveler===t.id?'active':'')} key={t.id} onClick={()=>{setTraveler(t.id);if(t.id!=='custom'){setAdults(t.adults);setChildren(t.children)}}}><span className="traveler-icon"><Icon size={18}/></span><div><strong>{t.label}</strong><span>{t.note}</span></div>{traveler===t.id&&<CheckCircle2 className="selection-check" size={18}/>}</button>})}</div>
       {traveler==='custom'&&<div className="fields"><label className="fieldgroup"><span className="label">Adults</span><input className="field" type="number" min={1} max={12} value={adults} onChange={e=>setAdults(Number(e.target.value))}/></label><label className="fieldgroup"><span className="label">Children (under 19)</span><input className="field" type="number" min={0} max={12} value={children} onChange={e=>setChildren(Number(e.target.value))}/></label></div>}
       <div className="notice good"><ShieldCheck/><span>RTD youth 19 and under ride free; the fare calculator accounts for that.</span></div>
       <div className="cta-row"><button className="btn btn-plain" onClick={()=>setStep(1)}><ArrowLeft/> Back</button><button className="btn btn-primary" onClick={saveTravelers}>Compare my options <ArrowRight/></button></div>
      </section>}
      {step===3&&<section><SectionTitle icon={Wallet} title="Compare ways to DEN" note="Round-trip costs and one-way travel time, in one view."/>
       <div className="inline-controls" style={{marginTop:18}}><span className="chip">{MODES.find(t=>t.id===traveler)?.label} · {localFmt(departureLocal)} → {localFmt(arrivalLocal)}</span><button className="link-button" onClick={()=>setStep(2)}><SlidersHorizontal/> Edit travelers</button></div>
       <div className="inline-controls" style={{marginTop:15,marginBottom:10}}><label className="label" style={{margin:0}}>Central Park parking eligibility <select className="select" style={{width:'auto',marginLeft:10,minHeight:34,padding:'6px 9px'}} value={district} onChange={e=>{setDistrict(e.target.value);loadComparison(adults,e.target.value)}}><option value="in">In RTD district</option><option value="out">Outside district</option></select></label><button className="link-button" onClick={()=>loadComparison(adults)}><RefreshCw/> Refresh</button></div>
       {busy&&!transport&&<p className="muted">Calculating published-rate estimates…</p>}
       {transport&&<div style={{border:'1px solid #e5ebf3',borderRadius:12,overflowX:'auto',marginTop:12}}><div className="transport-head"><span>Option</span><span>Est. round-trip cost</span><span>Est. time</span><span>Convenience</span><span/></div>
       {transport.rows.map(row=><button key={row.id} className="transport-row" onClick={()=>chooseTransport(row.id)}>
        <span className="option-name"><RoundIcon id={row.id}/><span>{row.option}<small>{row.costType==='published-rate estimate'?'Published-rate estimate':'Provider check required'}</small></span></span>
        <span className="cost">{money(row.amount)}<small>{row.amount!==null?'Round trip':'No live quote'}</small></span>
        <span className="other-value">{row.time||'Not verified'}</span><span className="other-value convenience">{row.convenience}</span><ChevronRight className="row-action" size={18}/>
       </button>)}
       <div className="source-bar"><span>Sources: <a href="https://www.flydenver.com/reserveparking/" target="_blank" rel="noreferrer">DEN</a> · <a href="https://www.rtd-denver.com/fares-passes/fares" target="_blank" rel="noreferrer">RTD fares</a> · <a href="https://www.rtd-denver.com/how-to-ride/parking" target="_blank" rel="noreferrer">RTD parking</a></span><span>One-way time ranges are indicative for central Denver, not live traffic. Rideshare quotes require provider access.</span></div>
       </div>}
       <div className="cta-row" style={{justifyContent:'flex-start'}}><button className="btn btn-plain" onClick={()=>setStep(2)}><ArrowLeft/> Back to travelers</button></div>
      </section>}
      {step===4&&<section><SectionTitle icon={Navigation} title="Your departure & return plan" note="Only the transportation option you selected — no unnecessary schedules."/>
       <div style={{marginTop:18}}><SummaryTimeline trip={selected} departureLocal={departureLocal} arrivalLocal={arrivalLocal} selected={selectedTransport} travelers={traveler} rtd={rtd} demo={sample} origin={origin}/></div>
       {picked&&<div className="notice good"><Wallet/><span><strong>Estimated round-trip cost: {selectedTransport==='rideshare'&&quote?money(displayedCost):money(picked.amount)}</strong> · {picked.costDetail}</span></div>}
       {selectedTransport==='rideshare'&&<div className="flight-card" style={{marginTop:14}}><strong>Check your live ride quote</strong><p className="sub">Open your provider app for a current XL fare. You can enter the combined outbound + return quote here to compare later; this isn't a live API quote.</p><div className="fields"><label className="fieldgroup"><span className="label">Your round-trip quote ($)</span><input className="field" type="number" min={0} placeholder="Example: 150" value={quote} onChange={e=>setQuote(e.target.value)}/></label></div><div style={{display:'flex',gap:10}}><a className="btn" target="_blank" rel="noreferrer" href="https://m.uber.com/looking">Open Uber <ExternalLink/></a><a className="btn" target="_blank" rel="noreferrer" href="https://www.lyft.com/rider">Open Lyft <ExternalLink/></a></div></div>}
       <div className="cta-row"><button className="btn btn-plain" onClick={()=>setStep(3)}><ArrowLeft/> Other options</button><button className="btn btn-primary" onClick={copyPlan}>{copied?<><Check/> Copied</>:<><Copy/> Copy travel plan</>}</button></div>
      </section>}
     </div></div>
    </div>
    <aside className="sidebar"><div className="sidecard"><h3><ShieldCheck/> How this works</h3><p>No bookings or purchases. Flight details come from authorized Google access, or from our fully fictional showcase itinerary.</p><div className="metric"><span>Personal data</span><strong>Private by default</strong></div><div className="metric"><span>Fare sources</span><strong>DEN + RTD official</strong></div><div className="metric"><span>Provider quotes</span><strong>Clearly labeled</strong></div></div>
     <div className="sidecard"><h3><Sparkles/> Built for real life</h3><ul><li>Find the next relevant trip, not every calendar entry</li><li>Autofill flight times without repetitive typing</li><li>Compare full round-trip costs</li><li>Show train departure times only after choosing transit</li><li>Keep estimates separate from verified data</li></ul></div>
     <div className="sidecard"><h3><MapPin/> Departure point</h3><p>Optional. Helps you check the drive to DEN in Maps.</p><div style={{marginTop:12}}><label className="label">City or starting address</label><input className="field" placeholder="e.g. Central Denver" value={origin} onChange={e=>setOrigin(e.target.value)} autoComplete="off"/></div><p className="tiny" style={{marginTop:9}}>Not sent to third-party pricing APIs.</p></div>
     <div className="sidecard"><h3><Info/> About this build</h3><p>A shareable travel-planning case study. The public demo uses fictional flights; production integrations require explicit user authorization and accurate provider sources.</p><a className="link-button" target="_blank" rel="noreferrer" href="https://github.com/paulgraven/travel-agent">View implementation <ArrowUpRight/></a></div></aside>
   </div>
   <footer className="footer"><span>Personal Travel Agent · Interactive travel-planning demonstration</span><span>Built with Next.js · Privacy-conscious by design</span></footer>
  </div>
 </div>;
}
