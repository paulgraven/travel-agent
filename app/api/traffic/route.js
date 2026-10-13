import {getToken} from 'next-auth/jwt';
import {drivingEstimate} from '../../../lib/traffic';
export const dynamic='force-dynamic';
export async function POST(request){
 const headers={'Cache-Control':'private, no-store'};
 if(process.env.NEXT_PUBLIC_SHOWCASE_ONLY==='true')return Response.json({available:false,reason:'Traffic requests are disabled in the fictional showcase.'},{headers});
 if(request.headers.get('origin')!==new URL(process.env.NEXTAUTH_URL||request.url).origin)return Response.json({error:'Invalid request origin'},{status:403,headers});
 const token=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
 if(!token)return Response.json({available:false,reason:'Sign in with Google before checking traffic.'},{status:401,headers});
 if(Number(request.headers.get('content-length')||0)>2048)return Response.json({error:'Request too large'},{status:413,headers});
 try{const {origin,destination,departureTime}=await request.json();return Response.json(await drivingEstimate({origin,destination,departureTime}),{headers})}catch{return Response.json({error:'Invalid traffic request'},{status:400,headers})}
}
