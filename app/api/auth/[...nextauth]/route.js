import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
export const authOptions={
 providers:[GoogleProvider({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,authorization:{params:{scope:'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly',access_type:'offline',prompt:'consent'}}})],
 secret:process.env.NEXTAUTH_SECRET,
 session:{strategy:'jwt'},
 callbacks:{
  async jwt({token,account}){
   if(account){token.googleAccessToken=account.access_token;token.googleExpiresAt=account.expires_at*1000;if(account.refresh_token)token.googleRefreshToken=account.refresh_token;return token}
   if(!token.googleRefreshToken||Date.now()<(token.googleExpiresAt||0)-60000)return token;
   try{const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:token.googleRefreshToken})});if(!response.ok)throw Error('Refresh failed');const data=await response.json();token.googleAccessToken=data.access_token;token.googleExpiresAt=Date.now()+data.expires_in*1000;token.googleAuthError=null;return token}catch{token.googleAuthError='RefreshAccessTokenError';return token}
  },
  async session({session,token}){session.googleConnected=Boolean(token.googleAccessToken&&!token.googleAuthError);session.googleAuthError=token.googleAuthError||null;return session}
 }
};
const handler=NextAuth(authOptions);
export {handler as GET,handler as POST};
