/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que Next empaquete estos paquetes de servidor: si se bundlean,
  // el driver de MongoDB pierde la resolución DNS/SRV de Atlas.
  serverExternalPackages: ['mongodb', 'bcryptjs', 'jsonwebtoken', 'nodemailer'],
};

export default nextConfig;
