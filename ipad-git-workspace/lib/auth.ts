import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: { 
        params: { 
          scope: 'repo user:email read:user',
          prompt: 'consent'
        } 
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.login = (profile as any)?.login
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken
      ;(session as any).login = token.login
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  }
})