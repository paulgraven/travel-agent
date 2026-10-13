export const dynamic='force-dynamic';
const PARKING='https://www.flydenver.com/parking-and-transportation/parking-lots/';
const RTD='https://app.rtd-denver.com/route/A/schedule';
function daysBetween(a,b){const x=Date.parse(a),y=Date.parse(b);return Number.isFinite(x)&&Number.isFinite(y)&&y>x?Math.ceil((y-x)/86400000):null}
export async function GET(request){
 const url=new URL(request.url),days=daysBetween(url.searchParams.get('parkingStart'),url.searchParams.get('parkingEnd'));
 let economyRate=null,checkedAt=null;
 try{const response=await fetch(PARKING,{next:{revalidate:3600}});if(response.ok){const html=await response.text();const text=html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');const match=text.match(/Economy(?:\s+(?:Parking|Lots?))?[^$]{0,180}\$\s*(\d+(?:\.\d{2})?)[^a-z]{0,20}(?:per day|\/day|daily)/i);if(match){economyRate=Number(match[1]);checkedAt=new Date().toISOString()}}}catch{}
 const economyCost=economyRate!==null&&days!==null?economyRate*days:null;
 return Response.json({columns:['Option','Est. round-trip cost','Est. time','Convenience'],rows:[
 {option:'DEN Economy parking',cost:economyCost===null?null:'$'+economyCost.toFixed(2),time:null,convenience:'Drive yourself; shuttle to terminal',source:PARKING,verified:economyCost!==null,ratePerDay:economyRate,days},
 {option:'Uber/Lyft XL',cost:null,time:null,convenience:'Door-to-door; car seats may be required',verified:false,source:null,note:'Live provider quotes unavailable without authorized pricing access'},
 {option:'Central Park RTD + A Line',cost:null,time:null,convenience:'Train plus station parking; eligibility must be checked',verified:false,source:RTD}
 ],rtd:{verified:false,source:RTD,note:'Exact date-specific train times require timetable validation'},checkedAt,notice:'Unverified costs and travel times intentionally remain blank. No bookings are made.'},{headers:{'Cache-Control':'no-store'}});
}
