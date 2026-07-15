import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Home Services CRM',
  description: 'AI-native CRM for home services companies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-900 p-6">
            <h1 className="text-2xl font-bold text-purple-400">CRM</h1>
            <nav className="mt-8 space-y-4">
              <a href="/" className="block text-slate-300 hover:text-white">Dashboard</a>
              <a href="/jobs" className="block text-slate-300 hover:text-white">Jobs</a>
              <a href="/crews" className="block text-slate-300 hover:text-white">Crews</a>
              <a href="/contacts" className="block text-slate-300 hover:text-white">Contacts</a>
              <a href="/properties" className="block text-slate-300 hover:text-white">Properties</a>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}