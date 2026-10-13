const DESTINATIONS={airport:'Denver International Airport, Denver, CO',station:'Central Park Station, Denver, CO'};
export async function drivingEstimate({origin,destination='airport',departureTime,key=process.env.GOOGLE_MAPS_API_KEY,fetcher=fetch}){
 if(!key)return {available:false,reason:'Live traffic is unavailable until the app owner configures Google Maps Routes access.'};
 if(typeof origin!=='string'||origin.trim().length<5||origin.length>300||!DESTINATIONS[destination])return {available:false,reason:'Enter a complete starting address and select a supported destination.'};
 const body={origin:{address:origin.trim()},destination:{address:DESTINATIONS[destination]},travelMode:'DRIVE',routingPreference:'TRAFFIC_AWARE',computeAlternativeRoutes:false,languageCode:'en-US',units:'IMPERIAL'};
 const requested=Date.parse(departureTime);
 if(Number.isFinite(requested)&&requested>Date.now())body.departureTime=new Date(requested).toISOString();
 try{
  const response=await fetcher('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.duration,routes.staticDuration,routes.distanceMeters'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {available:false,reason:'Google Maps could not return traffic information. Check Routes API access and billing.'};
  const data=await response.json(),route=data.routes?.[0];
  const seconds=Number(String(route?.duration||'').replace(/s$/,''));
  if(!Number.isFinite(seconds)||seconds<=0||seconds>18000)return {available:false,reason:'No supported driving route was returned.'};
  return {available:true,minutes:Math.ceil(seconds/60),destination,asOf:new Date().toISOString(),type:body.departureTime?'traffic-aware forecast':'current traffic-aware estimate',departureTime:body.departureTime||null,source:'Google Maps Routes',disclaimer:'Traffic estimates can change. Recheck before leaving.'};
 }catch{return {available:false,reason:'Traffic service timed out or is unavailable. Use a driving estimate from Maps.'}}
}
