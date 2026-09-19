/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No hay linter configurado en este paquete (ver package.json) - evita que
  // `next build` intente ejecutar/instalar ESLint interactivamente.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
