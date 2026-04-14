import type { Metadata } from 'next'
import './globals.css'
import DesktopBlock from '@/components/DesktopBlock'
import PostHogProvider from '@/providers/PostHogProvider'

export const metadata: Metadata = {
  title: 'SUB PAY SAVER — Find which subscriptions to cancel',
  description: 'A 90-second quiz that tells you exactly which subscriptions to cancel and why. No login. No bank access.',
  openGraph: {
    title: 'SUB PAY SAVER',
    description: 'Find out which subscriptions you should cancel — in 90 seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0F4C81" />
      </head>
      <body className="h-full"><PostHogProvider><DesktopBlock>{children}</DesktopBlock></PostHogProvider></body>
    </html>
  )
}
