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

export function isHandheldDevice(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): boolean {
  if (typeof navigator !== 'undefined') {
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
    if (uaData?.mobile) return true;
  }
  if (/Android.+Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return true;
  }
  if (/Android|iPad/i.test(userAgent)) return true;
  const touchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints;
  return /Macintosh/i.test(userAgent) && touchPoints > 1;
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
