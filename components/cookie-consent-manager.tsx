'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as CookieConsent from 'vanilla-cookieconsent'
import 'vanilla-cookieconsent/dist/cookieconsent.css'
import { Settings2 } from 'lucide-react'

let initialized = false

function createConfig(refresh: () => void): CookieConsent.CookieConsentConfig {
  return {
    mode: 'opt-in',
    autoShow: true,
    respectGpc: true,
    hideFromBots: true,
    cookie: {
      name: 'cc_cookie',
      path: '/',
      secure: true,
      sameSite: 'Lax',
      expiresAfterDays: 180,
      useLocalStorage: false,
    },
    guiOptions: {
      consentModal: {
        layout: 'box',
        position: 'bottom center',
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: 'box',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {},
    },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'Your cookies, your call',
            description: 'Essential cookies keep sign-in and security working. Optional analytics helps us improve the games and stays off unless you allow it.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject optional',
            showPreferencesBtn: 'Customize settings',
            label: 'Cookie consent',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject optional',
            savePreferencesBtn: 'Save choices',
            closeIconLabel: 'Close cookie preferences',
            sections: [
              {
                title: 'How Arcadia Play uses cookies',
                description: 'Essential cookies support sign-in, security, and saved preferences. Optional analytics is disabled unless you choose it.',
              },
              {
                title: 'Essential',
                description: 'Required for sign-in and security. These cookies cannot be disabled.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Analytics',
                description: 'Usage insights that help us improve play.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Change your choices',
                description: 'You can reopen these preferences at any time using the Cookie settings button.',
              },
            ],
          },
        },
      },
    },
    onFirstConsent: refresh,
    onChange: ({ changedCategories }) => {
      if (changedCategories.includes('analytics')) refresh()
    },
  }
}

export function CookieConsentManager() {
  const router = useRouter()

  useEffect(() => {
    if (initialized) return
    initialized = true
    void CookieConsent.run(createConfig(() => router.refresh()))
  }, [router])

  return (
    <button
      type="button"
      data-cc="show-preferencesModal"
      className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur transition hover:border-cyan-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label="Open cookie settings"
    >
      <Settings2 aria-hidden="true" className="size-3.5" />
      Cookie settings
    </button>
  )
}
