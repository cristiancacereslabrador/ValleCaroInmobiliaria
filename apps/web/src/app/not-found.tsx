import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page">
      <p className="eyebrow">Página no encontrada</p>
      <h1>Esa ruta no existe</h1>
      <p className="page-subtitle">Vuelve al catálogo o escríbenos si buscabas un inmueble concreto.</p>
      <Link href="/" className="btn">
        Ver catálogo
      </Link>
    </main>
  );
}
