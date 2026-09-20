export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMq = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(standaloneMq || iosStandalone);
}

export function isInAppBrowser(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
  return /WhatsApp|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat/i.test(userAgent);
}

export function isIosDevice(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent);
}

export function chromeIntentUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return `intent://${url.host}${url.pathname}${url.search}${url.hash}#Intent;scheme=${url.protocol.replace(':', '')};package=com.android.chrome;end`;
  } catch {
    return null;
  }
}
