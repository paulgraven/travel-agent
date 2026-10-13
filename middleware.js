import {NextResponse} from 'next/server';
export function middleware(request){
  if(process.env.NEXT_PUBLIC_SHOWCASE_ONLY==='true'){
    return new NextResponse(JSON.stringify({error:'Private account integrations are disabled in the public demo.'}),{status:404,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  }
  return NextResponse.next();
}
export const config={matcher:['/api/auth/:path*','/api/flights/:path*','/api/mcp/:path*']};
