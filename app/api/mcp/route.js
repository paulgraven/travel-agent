export const dynamic='force-dynamic';
const tools=[{name:'compare_transport',description:'Get the current transportation comparison; prices not verified are omitted',inputSchema:{type:'object',properties:{parkingStart:{type:'string'},parkingEnd:{type:'string'}}}},{name:'rtd_a_line',description:'Get date-specific published RTD A Line timetables when license is configured',inputSchema:{type:'object',properties:{outboundDate:{type:'string'},returnDate:{type:'string'}},required:['outboundDate','returnDate']}}];
function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','MCP-Protocol-Version':'2025-03-26'}})}
export async function POST(request){
 const expected=process.env.MCP_API_KEY;
 if(!expected||expected.length<32||request.headers.get('authorization')!=='Bearer '+expected)return json({jsonrpc:'2.0',id:null,error:{code:-32001,message:'Unauthorized'}},401);
 let input;try{input=await request.json()}catch{return json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}},400)}
 const id=input.id??null;
 if(input.method==='initialize')return json({jsonrpc:'2.0',id,result:{protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'personal-travel-agent',version:'0.3.0'}}});
 if(input.method==='notifications/initialized')return new Response(null,{status:202});
 if(input.method==='tools/list')return json({jsonrpc:'2.0',id,result:{tools}});
 if(input.method==='tools/call'){
 const name=input.params?.name,args=input.params?.arguments||{};if(!tools.some(t=>t.name===name))return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Tool not found'}});
 const path=name==='compare_transport'?'/api/transport':'/api/rtd';const query=new URLSearchParams(args);const url=new URL(path+'?'+query,new URL(request.url).origin);
 const response=await fetch(url,{cache:'no-store'});const data=await response.json();return json({jsonrpc:'2.0',id,result:{isError:!response.ok,content:[{type:'text',text:JSON.stringify(data)}]}});
 }
 return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
}
export async function GET(){return json({error:'MCP requires authenticated POST'},405)}
