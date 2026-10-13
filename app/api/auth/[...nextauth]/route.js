import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
const handler=NextAuth({providers:[Google({authorization:{params:{scope:'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly',access_type:'offline',prompt:'consent'}}})],session:{strategy:'jwt'},callbacks:{async jwt({token,account}){if(account){token.googleAccessToken=account.access_token;token.googleExpiresAt=account.expires_at;token.googleRefreshToken=account.refresh_token}return token},async session({session,token}){session.googleConnected=Boolean(token.googleAccessToken);return session}}});
export {handler as GET,handler as POST};
