'use client';

import { buildWhatsAppLink } from '../lib/format';
import { trackWhatsAppLead } from '../lib/api/leads';

export function WhatsAppCta({
  digits,
  message,
  propertyId,
  className,
  children,
}: {
  digits: string;
  message: string;
  propertyId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href={buildWhatsAppLink(digits, message)}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackWhatsAppLead({ propertyId, message })}
    >
      {children}
    </a>
  );
}
