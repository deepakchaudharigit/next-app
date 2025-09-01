import NextAuth from 'next-auth'
import { authOptions } from '@lib/nextauth' // Import authOptions from the correct file

const handler = NextAuth(authOptions)

// Add debugging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 NextAuth handler initialized')
  console.log('🔧 NextAuth URL:', process.env.NEXTAUTH_URL)
  console.log('🔑 NextAuth Secret exists:', !!process.env.NEXTAUTH_SECRET)
}

// THIS IS CRITICAL - Export both GET and POST handlers
export { handler as GET, handler as POST }
