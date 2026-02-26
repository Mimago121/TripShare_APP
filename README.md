# Gestión de Viajes en Grupo (TFG)
**Angular + Ktor + MySQL + Docker**

Aplicación web para organizar viajes en grupo: creación de viajes, itinerario por días, gestión de gastos compartidos y recuerdos (fotos/notas).

---

# 🧩 Tecnologías utilizadas

- **Frontend:** Angular
- **Backend:** Ktor (Kotlin)
- **ORM:** Exposed
- **Pool de conexiones:** HikariCP
- **Base de datos:** MySQL
- **Contenedores:** Docker + Docker Compose

---

# 🚀 Funcionalidades del MVP

## 1️⃣ Autenticación y perfiles
- Login con email.
- Perfil básico: nombre, email, avatar.

## 2️⃣ Gestión de viajes
- Crear viaje (nombre, destino, fechas).
- Invitar miembros por email o enlace.
- Ver lista de viajes en los que participas.

## 3️⃣ Itinerario
- Generación automática de días entre `startDate` y `endDate`.
- Añadir actividades (hora, título, descripción).
- Visualización por día.
- Aviso si hay actividades solapadas.

## 4️⃣ Gastos compartidos
- Añadir gasto (importe, descripción, quién pagó).
- Balance simple por usuario.
- Tabla de deudas entre miembros.

## 5️⃣ Memories
- Subida de fotos.
- Añadir notas relacionadas con el viaje.

---

# 📁 Estructura del proyecto

```
/
├── frontend/              # Aplicación Angular
├── backend/               # API REST con Ktor
├── docker/                # Scripts de inicialización MySQL
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Requisitos previos

- Docker + Docker Compose
- Node.js (v18 o superior recomendado)
- JDK 17
- npm

---

# 🐳 Base de Datos (MySQL con Docker)

## Levantar la base de datos

```bash
docker compose up -d db
```

Comprobar que el contenedor está activo:

```bash
docker ps
```

## Reiniciar completamente la base de datos (borra datos)

```bash
docker compose down -v
docker compose up -d db
```

---

# 🔧 Backend (Ktor)

## Ejecutar en local

```bash
cd backend
./gradlew run
```

El backend arrancará en:

```
http://localhost:8080
```

## Configuración típica

El backend utiliza:

- Ktor para la API REST
- Exposed para acceso a base de datos
- HikariCP como pool de conexiones
- Sesiones mediante cookies (si está implementado)

Configuración habitual en `application.conf` o variables de entorno:

```
DB_URL=jdbc:mysql://localhost:3306/trip_share_db
DB_USER=usuario
DB_PASSWORD=password
```

---

# 🌐 Frontend (Angular)

## Instalar dependencias

```bash
cd frontend
npm install
```

## Ejecutar en desarrollo

```bash
npm start
```

La aplicación se abrirá en:

```
http://localhost:4200
```

---

# 🔁 Configuración del Proxy (Angular → Backend)

Para evitar problemas de CORS en desarrollo, el frontend usa proxy.

Ejemplo `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

En este caso:

- Angular llama a `/api/trips`
- El proxy redirige a `http://localhost:8080/trips`

---

# 🔌 Endpoints principales (ejemplo)

```
POST   /auth/login
POST   /auth/register
GET    /users/me
GET    /trips
POST   /trips
GET    /trips/{id}/activities
POST   /trips/{id}/activities
POST   /trips/{id}/expenses
POST   /trips/{id}/memories
```

---

# 🧪 Tests

## Backend

```bash
cd backend
./gradlew test
```

## Frontend

```bash
cd frontend
npm test
```

---

# 👥 Equipo

Proyecto desarrollado como Trabajo Fin de Grado.

---

# 📄 Licencia

Proyecto académico de uso educativo.
