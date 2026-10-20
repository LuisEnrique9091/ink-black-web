# Ink Black · Sistema de Gestión del Estudio

Aplicación web para administrar la agenda de sesiones, el inventario de insumos y los reportes de consumo del estudio de tatuajes **Ink Black**.

## Tecnologías

- **Next.js 16** (App Router, React 19)
- **MongoDB** (driver oficial)
- **JWT** en cookie `httpOnly` para la sesión
- **Nodemailer** para el código de verificación (OTP)
- **Tailwind CSS 4**

## Requisitos

- Node.js 20 o superior
- Una base de datos MongoDB (Atlas o local)
- Una cuenta de correo con contraseña de aplicación (Gmail)

## Variables de entorno

Crea un archivo `.env.local` en la raíz (toma como base `.env.example`):

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión de MongoDB |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Cadena secreta para firmar los tokens |
| `EMAIL_USER` | Cuenta de correo que envía los códigos |
| `EMAIL_PASS` | Contraseña de aplicación del correo |

## Instalación

```bash
npm install
npm run seed        # crea los índices de MongoDB
npm run dev         # http://localhost:3000
```

> `npm run seed` y `npm run migrate:kits` leen `.env.local` automáticamente.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Análisis estático |
| `npm run seed` | Crea índices de la base de datos |
| `npm run migrate:kits` | Simula la migración de recetas de kits |
| `npm run migrate:kits -- --apply` | Aplica la migración de recetas |

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/        # login, register, verify, resend, logout, session
│   │   ├── citas/       # agenda (GET/POST/PATCH)
│   │   ├── productos/   # inventario (GET/POST/PATCH)
│   │   ├── kits/        # recetas de kits
│   │   ├── alertas/     # stock crítico y caducidades
│   │   └── reportes/    # estadísticas agregadas
│   ├── agenda/          # página de sesiones
│   ├── inventario/      # página de almacén
│   ├── nueva-sesion/    # registro de sesión + descuento de material
│   ├── reportes/        # análisis de consumo
│   ├── login/
│   ├── register/
│   ├── error.js
│   └── not-found.js
├── components/          # Sidebar, Modal, Toast
├── lib/                 # db, auth, http, mailer, validadores, fechas
└── middleware.js        # protección de rutas
scripts/
├── seed.mjs
└── migrate-kits.mjs
```

## Colecciones de MongoDB

```
Users-InkBlack  { email (único), username, hashedPassword, isVerified,
                  otpCode, otpExpiresAt, otpAttempts, otpSentAt, createdAt }
productos       { nombre, categoria, stock_actual, stock_minimo, unidad_medida,
                  fecha_caducidad, createdAt, updatedAt }
kits_insumos    { kit_nombre, productoId, insumo_nombre, cantidad_a_descontar }
citas           { cliente, estilo, fecha:'YYYY-MM-DD', hora:'HH:MM', artista,
                  kit_nombre, estado, usuario, createdAt }
movimientos     { tipo:'entrada'|'consumo', productoId, producto_nombre, cantidad,
                  motivo, citaId, kit_nombre, usuario, fecha }
```

Ejemplo de receta de kit:

```js
{ kit_nombre: "Kit Estándar", insumo_nombre: "Agujas 3RL", cantidad_a_descontar: 1 }
```

`npm run migrate:kits -- --apply` agrega el `productoId` a las recetas existentes.

## Flujo de uso

1. **Registro** → el correo recibe un código de 6 dígitos.
2. **Verificación** → el código expira en 10 minutos (máximo 5 intentos).
3. **Login** → la sesión se guarda en una cookie `httpOnly`.
4. **Nueva Sesión** → valida stock, descuenta material e inserta la cita de forma atómica (si no hay stock, no se descuenta nada).
5. **Inventario** → alta de insumos, surtir stock y editar caducidad.
6. **Reportes** → uso por kit, salud del inventario y consumo real de insumos.

## Despliegue en Railway

1. Conecta el repositorio de GitHub al proyecto de Railway.
2. Configura las 5 variables de entorno en **Variables** (no se usa `.env.local` en el servidor).
3. Cada `git push` a `main` redespliega automáticamente.
4. Si el correo falla en producción, verifica que `EMAIL_PASS` sea una contraseña de aplicación de Gmail.

## Notas

- La app es responsive: sidebar fijo en escritorio y menú deslizante en móvil.
- El material descontado al cancelar una cita **no** se devuelve automáticamente; se ajusta manualmente desde Inventario.
