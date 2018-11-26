/* eslint-disable import/prefer-default-export */

declare global {
  interface Window {
    ga: any
  }
}

let doNotTrack = false

try {
  if (
    window.doNotTrack ||
    navigator.doNotTrack ||
    // @ts-ignore
    navigator.msDoNotTrack ||
    'msTrackingProtectionEnabled' in window.external
  ) {
    // The browser supports Do Not Track!

    if (
      window.doNotTrack == '1' ||
      navigator.doNotTrack == 'yes' ||
      navigator.doNotTrack == '1' ||
      // @ts-ignore
      navigator.msDoNotTrack == '1' ||
      // @ts-ignore
      window.external.msTrackingProtectionEnabled()
    ) {
      doNotTrack = true
    }
  }
} catch (error) {
  console.error(error)
}

export const trackPageView = ({ location, userId }) => {
  console.log('trackPageView', location, userId)
  if (
    typeof window !== 'undefined' &&
    typeof window.ga !== 'undefined' &&
    !doNotTrack &&
    process.env.NODE_ENV === 'production'
  ) {
    window.ga('set', 'page', location.pathname + location.search)
    window.ga('send', 'pageview', location.pathname + location.search, {
      userId: userId || undefined,
    })
  }
}
