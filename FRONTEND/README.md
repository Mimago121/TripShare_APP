# Frontend (Angular) — TripShare

Este directorio contiene el **frontend web** de TripShare, desarrollado con **Angular**.  
Se encarga de la interfaz de usuario (pantallas, formularios y navegación) y de la comunicación con el backend (Ktor) mediante peticiones HTTP en formato JSON.

---

## 📌 Funcionalidades principales

El frontend implementa las siguientes funcionalidades del MVP:

- Registro e inicio de sesión de usuarios.
- Visualización y edición básica del perfil.
- Listado de viajes en los que participa el usuario.
- Creación de nuevos viajes.
- Visualización del detalle de un viaje.
- Gestión del itinerario (añadir actividades y verlas ordenadas).
- Gestión de gastos compartidos y visualización del balance.
- Subida y visualización de recuerdos (según implementación actual).
- Validación de formularios y control de errores en el lado cliente.

---

## 🧱 Estructura del proyecto

La estructura del frontend sigue una arquitectura basada en componentes y servicios:

```
src/
 └── app/
     ├── components/      # Componentes visuales
     ├── services/        # Servicios HTTP (comunicación con backend)
     ├── interfaces/      # Modelos y tipado de datos
     ├── pages/           # Pantallas principales (si aplica)
     ├── app.routes.ts    # Configuración de rutas
     └── app.component.ts
```

### Componentes
Gestionan la interfaz y la interacción con el usuario.

### Servicios
Centralizan las peticiones HTTP al backend.

### Interfaces / Modelos
Definen la estructura de los datos (Trip, User, Expense, etc.), mejorando la seguridad y mantenibilidad del código.

### Rutas
Permiten la navegación entre vistas.

---

## ⚙️ Requisitos previos

- Node.js (v18 o superior recomendado)
- npm
- Angular CLI (opcional pero recomendado)

---

## ▶️ Instalación y ejecución

### 1️⃣ Instalar dependencias

```bash
cd frontend
npm install
```

### 2️⃣ Ejecutar en desarrollo

```bash
npm start
```

o

```bash
ng serve
```

La aplicación se ejecutará en:

```
http://localhost:4200
```

---

## 🔁 Configuración del Proxy (Desarrollo)

Para evitar problemas de CORS, se utiliza un archivo `proxy.conf.json`.

### Ejemplo:

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

Esto permite:

- Llamar desde Angular a `/api/trips`
- Redirigir automáticamente a `http://localhost:8080/trips`

### Recomendación importante

En los servicios Angular, utilizar siempre rutas relativas:

```ts
this.http.get('/api/trips');
```

Evitar usar directamente `http://localhost:8080/...`.

---

## 🔌 Flujo de comunicación

El flujo de datos sigue este patrón:

1. El usuario interactúa con un componente.
2. El componente llama a un servicio.
3. El servicio realiza una petición HTTP al backend.
4. El backend devuelve datos en formato JSON.
5. El componente actualiza la vista con los datos recibidos.

---

## 🍪 Gestión de sesión (si se usan cookies)

Si el backend utiliza cookies de sesión, puede ser necesario incluir:

```ts
{ withCredentials: true }
```

Ejemplo:

```ts
this.http.get('/api/trips', { withCredentials: true });
```

---

## 🧪 Tests

Para ejecutar los tests unitarios:

```bash
npm test
```

---

## 🧯 Problemas comunes

### No conecta con el backend
- Verificar que el backend está activo en `http://localhost:8080`.
- Comprobar que el proxy está correctamente configurado.
- Asegurarse de usar rutas `/api/...`.

### Problemas de CORS
- Confirmar que el proxy está activo.
- Revisar configuración CORS en el backend.

### Errores de dependencias
- Ejecutar nuevamente `npm install`.
- Verificar versión de Node.js.

---

## 📦 Build para producción

Para generar la versión optimizada:

```bash
ng build --configuration production
```

El resultado se generará en la carpeta:

```
dist/
```

---

## 📌 Notas finales

El frontend está diseñado siguiendo una separación clara entre presentación (componentes) y comunicación (servicios), facilitando el mantenimiento y la escalabilidad futura del sistema.
