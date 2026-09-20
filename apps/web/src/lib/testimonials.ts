export interface Testimonial {
  quote: string;
  author: string;
  place?: string;
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Liseth nos acompañó en la compra de la quinta. Clara con planta eléctrica, tanque de agua y papeles.',
    author: 'Familia M.',
    place: 'Pirineos, San Cristóbal',
  },
  {
    quote: 'Alquilamos el local en menos de dos semanas. Respuesta por WhatsApp el mismo día.',
    author: 'Comerciante R.',
    place: 'Centro',
  },
  {
    quote: 'Vendimos el apartamento con fotos reales y visitas organizadas. Sin rodeos.',
    author: 'Ana G.',
    place: 'La Concordia',
  },
];

export function parseTestimonials(raw: string | null | undefined): Testimonial[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Testimonial =>
        Boolean(
          item &&
            typeof item === 'object' &&
            typeof (item as Testimonial).quote === 'string' &&
            (item as Testimonial).quote.trim() &&
            typeof (item as Testimonial).author === 'string' &&
            (item as Testimonial).author.trim(),
        ),
    );
  } catch {
    return [];
  }
}

export function serializeTestimonials(items: Testimonial[]): string {
  return JSON.stringify(
    items
      .map((item) => ({
        quote: item.quote.trim(),
        author: item.author.trim(),
        place: item.place?.trim() || undefined,
      }))
      .filter((item) => item.quote && item.author),
  );
}
