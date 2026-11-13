import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { CookieConsentManager } from '@/components/cookie-consent-manager'
import { COOKIE_CONSENT_COOKIE, hasAnalyticsConsent } from '@/lib/cookie-consent'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arcadia Play — 12 Free Games + Premium 3D Campaigns',
  description: 'Play 12 complete free games, meet friends in live multiplayer rooms, or unlock two premium 3D campaigns with Arcadia Pass.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07101f',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieValue = (await cookies()).get(COOKIE_CONSENT_COOKIE)?.value
  const analyticsAllowed = hasAnalyticsConsent(cookieValue)

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieConsentManager />
        {process.env.NODE_ENV === 'production' && analyticsAllowed && <Analytics />}
      </body>
    </html>
  )
}
