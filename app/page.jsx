'use client';
import {useEffect,useState} from 'react';
export default function Home(){
 const [stage,setStage]=useState(0),[flights,setFlights]=useState(null),[transport,setTransport]=useState(null),[rtd,setRtd]=useState(null),[error,setError]=useState('');
 const [travelers,setTravelers]=useState('Just me'),[option,setOption]=useState('');
 const [outbound,setOutbound]=useState(''),[inbound,setInbound]=useState('');
 async function load(){setError('');try{const r=await fetch('/api/flights',{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Google account connection required');setFlights(data);setStage(1)}catch(e){setError(e.message)}}
 async function compare(){setError('');const q=new URLSearchParams({parkingStart:outbound,parkingEnd:inbound});const r=await fetch('/api/transport?'+q,{cache:'no-store'});const data=await r.json();if(!r.ok){setError('Transportation comparison unavailable');return}setTransport(data);setStage(2)}
 async function select(name){setOption(name);setRtd(null);setStage(3);if(name.includes('RTD')&&outbound&&inbound){const q=new URLSearchParams({outboundDate:outbound.slice(0,10),returnDate:inbound.slice(0,10)});const r=await fetch('/api/rtd?'+q,{cache:'no-store'});setRtd(await r.json())}}
 const input={padding:10,border:'1px solid #cbd5e1',borderRadius:7,maxWidth:'100%'};
 return <main style={{background:'white',padding:28,borderRadius:16,boxShadow:'0 2px 12px #0001'}}>
 <h1>Personal Travel Agent</h1><p>Flight discovery and transportation planning. No bookings or purchases.</p>
 <p><a href='/api/auth/signin/google'>Connect Google account</a> · <a href='/api/auth/signout'>Sign out</a></p>
 {stage===0&&<><p>Sign in with Google, then search your authorized Gmail and Calendar for upcoming flight candidates.</p><button onClick={load} style={input}>Find my flights</button></>}
 {error&&<p role='alert' style={{color:'#a00'}}>{error}</p>}
 {stage>=1&&<><h2>Flight candidates</h2><p>Confirm your flights manually; matching emails and events are not proof of a booking.</p><div style={{maxHeight:260,overflow:'auto',background:'#f1f5f9',padding:12,borderRadius:8}}>{(flights?.calendar||[]).map((f,i)=><p key={'c'+i}><strong>Calendar:</strong> {f.summary} — {f.start}</p>)}{(flights?.gmail||[]).map((f,i)=><p key={'m'+i}><strong>Gmail:</strong> {f.subject} — {f.date}</p>)}{!(flights?.calendar?.length||flights?.gmail?.length)&&<p>No flight candidates found.</p>}</div>
 <h2>Who’s traveling?</h2><select style={input} value={travelers} onChange={e=>setTravelers(e.target.value)}>{['Just me','Whitney and me','Whole family including Izzy and Emma','Other'].map(x=><option key={x}>{x}</option>)}</select>
 <h3>Travel dates and times</h3><p>Use Denver local times for departure to and return from DEN. These determine parking duration and RTD service dates.</p>
 <label>Leave for airport <input style={input} type='datetime-local' value={outbound} onChange={e=>setOutbound(e.target.value)}/></label>{' '}
 <label>Return to Denver <input style={input} type='datetime-local' value={inbound} onChange={e=>setInbound(e.target.value)}/></label>
 <p><button style={input} onClick={compare}>Compare transportation</button></p></>}
 {stage>=2&&<><h2>Transportation comparison</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{transport?.columns.map(c=><th key={c} style={{textAlign:'left',padding:8,borderBottom:'1px solid #ddd'}}>{c}</th>)}</tr></thead><tbody>{transport?.rows.map(row=><tr key={row.option}><td style={{padding:8}}><button style={input} onClick={()=>select(row.option)}>{row.option}</button></td><td>{row.cost?(row.verified?row.cost:'Est. '+row.cost+' (unverified current rate)'):'Not verified'}</td><td>{row.time||'Not verified'}</td><td>{row.convenience}</td></tr>)}</tbody></table></div><p>Parking source: <a href='https://www.flydenver.com/parking-and-transportation/parking-lots/'>DEN official rates</a>. Rideshare requires live provider access.</p></>}
 {stage>=3&&<><h2>Selected: {option}</h2>{option.includes('RTD')?<><p><a href='https://app.rtd-denver.com/route/A/schedule'>RTD official A Line schedule</a></p>{rtd?<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(rtd,null,2)}</pre>:<p>Exact date-specific departures have not been verified.</p>}</>:<p>Detailed outbound and return timing requires verified flight departure and arrival times, plus traffic and pickup/parking buffers.</p>}</>}
 <p style={{fontSize:13,color:'#64748b'}}>Information is shown only when sourced or explicitly identified as unverified.</p></main>
}