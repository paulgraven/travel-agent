import {SOURCES,RATES} from './planner.js';
const plain=html=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
async function page(url){const r=await fetch(url,{next:{revalidate:3600},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Source unavailable');return plain(await r.text())}
export async function checkRates(){
 const results=await Promise.allSettled([page(SOURCES.den),page(SOURCES.fares),page(SOURCES.parking)]);
 const checks=results.map((r,i)=>{
  if(r.status!=='fulfilled')return {verified:false,source:[SOURCES.den,SOURCES.fares,SOURCES.parking][i]};
  const text=r.value;
  const verified=i===0?new RegExp('Economy Lots\\s*\\$'+RATES.denEconomyPerDay+'\\b').test(text):i===1?/Airport Day Pass.{0,500}\$10\b/.test(text):/\$2\.00 daily fee applies to vehicles registered within the district/.test(text);
  return {verified,source:[SOURCES.den,SOURCES.fares,SOURCES.parking][i]};
 });
 return {checks,checkedAt:new Date().toISOString(),allVerified:checks.every(c=>c.verified)};
}
