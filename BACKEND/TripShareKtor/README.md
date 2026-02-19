# 🌍 TripShare API - Backend

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)
![Ktor](https://img.shields.io/badge/ktor-%23087CFA.svg?style=for-the-badge&logo=ktor&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Exposed](https://img.shields.io/badge/JetBrains_Exposed-Black?style=for-the-badge&logo=jetbrains)


Este documento describe en detalle el subproyecto **backend** de la aplicación TripShare. El backend está construido utilizando **Kotlin** y el framework **Ktor**, con una arquitectura modular y orientada a servicios que facilita el mantenimiento, las pruebas y la extensión.

---

## 📌 Objetivo

Servir como la capa de negocio y datos para la aplicación móvil/web. El servidor expone una API RESTful consumida por el frontend, gestionando autenticación, autorización, persistencia de datos y lógica de dominio.

El diseño actual permite:

- Manejar múltiples entidades como usuarios, viajes, actividades, gastos, chats, memorias, amigos y mapas.
- Escalar horizontalmente mediante contenedores o despliegues en la nube.
- Integrarse con diferentes clientes y adaptarse a cambios en los requisitos.

---

## 🗂️ Estructura del proyecto

La carpeta raíz del backend es `TripShareKtor`; a continuación se muestra su estructura principal y la finalidad de cada componente:

```
TripShareKtor/
├── build.gradle.kts          # Configuración del sistema de compilación y dependencias
├── settings.gradle.kts       # Definición del proyecto raíz para Gradle
├── gradle/                   # Wrapper de Gradle (garantiza versión consistente)
├── src/main/kotlin/          # Código fuente principal
│   ├── Application.kt        # Entrada de la aplicación; inicializa módulos y el servidor
│   ├── database/             # Factories y utilidades para conexión de BD
│   ├── dto/                  # Data Transfer Objects usados en endpoints
│   ├── entities/             # Clases de dominio que mapean a la BD
│   ├── plugins/              # Configuraciones de Ktor: HTTP, Routing, Serialization, CORS, etc.
│   ├── repository/           # Repositorios que encapsulan el acceso a datos
│   ├── routes/               # Agrupaciones de rutas por responsabilidad (Auth, Users, Trips, etc.)
│   └── tables/               # Definición de tablas mediante Exposed
└── build/                    # Directorio generado con los artefactos tras compilación
```

Las carpetas `.gradle/` y `gradle/` contienen información de caché y el wrapper que permiten compilar el proyecto sin instalaciones adicionales.

---

## 📦 Dependencias principales

Las bibliotecas y plugins más relevantes declarados en `build.gradle.kts` son:

- **Ktor Server Core** y módulos HTTP, Auth, Sessions, WebSockets, etc.
- **Exposed** (core, DAO, JDBC) como ORM para interacción con MySQL.
- **HikariCP** para el pool de conexiones.
- **Kotlinx Serialization** para JSON.
- **Logback** para logging.
- **JUnit 5** y **Ktor Server Test Host** para pruebas.

Las versiones exactas pueden consultarse y actualizarse en el archivo mencionado. Se recomienda usar las versiones estables más recientes compatibles.

---

## 🚀 Entorno de desarrollo y ejecución

### Requisitos previos

- Java Development Kit (JDK) 11 o superior.
- Git y acceso a un terminal/consola.
- Docker (opcional pero recomendado para la base de datos).

### Compilación y ejecución

Dentro del directorio `BACKEND/TripShareKtor`, ejecuta:

```bash
./gradlew clean build          # Compila y ejecuta pruebas
./gradlew run                  # Inicia el servidor localmente
```

En Windows se utiliza `gradlew.bat` en lugar de `./gradlew`.

El servidor quedará escuchando por defecto en `http://localhost:8080`. El puerto y otras propiedades pueden configurarse mediante variables de entorno o el archivo `application.conf`.

### Base de datos con Docker

Se proporciona un `docker-compose.yml` en la carpeta `DATABASE` para orquestar un contenedor MySQL con los esquemas iniciales. Para usarlo:

```bash
cd ../DATABASE
docker-compose up -d
```

Los scripts de inicialización están en `DATABASE/docker/mysql/init.sql`.

Se recomienda utilizar un entorno de Docker separado para pruebas de integración; ajustes adicionales se encuentran en dicha configuración.

---

## 🧩 Componentes clave y flujo de petición

1. **Application.kt**: punto de arranque que configura la base de datos, registra plugins y monta las rutas.
2. **Plugins**: cada archivo en `plugins/` configura una parte de Ktor (por ejemplo, `Serialization.kt` habilita JSON). El archivo `Routing.kt` agrega los routers definidos en `routes/`.
3. **Routes**: cada archivo en `routes/` define un conjunto de endpoints relacionados (e.g., `AuthRoutes.kt` expone rutas de login/registro, `TripRoutes.kt` gestiona viajes).
4. **DTOs y Entities**: las DTOs representan datos entrantes/salientes en la API; las entidades mapean a tablas mediante Exposed.
5. **Repositorios**: encapsulan la lógica de acceso a datos, interactuando con las tablas de Exposed y devolviendo objetos de dominio.

Este flujo asegura separación clara de responsabilidades y facilita la cobertura de pruebas.

---

## 🛠 Cómo contribuir

Para colaborar en este subproyecto, sigue estas pautas:

1. **Clona el repositorio** y crea una rama basada en `main`.
2. **Implementa cambios** en el paquete correspondiente:
   - Nuevos endpoints → agrega archivos bajo `routes/` y registra la ruta en `plugins/Routing.kt`.
   - Nuevos modelos de datos → define entidades en `entities/` y tablas en `tables/`.
   - Acceso a datos → crea/ajusta repositorios en `repository/`.
   - Lógica de negocio adicional puede residir en servicios auxiliares si es necesario.
3. **Pruebas**: cada cambio significativo debe contar con pruebas unitarias o de integración. Usa la infraestructura de JUnit y Ktor Test Host.
4. **Documentación**: actualiza este README y añade comentarios claros en el código. Describe la intención de los cambios en las descripciones de tus commits.
5. **Revisión**: abre un Pull Request contra la rama `main`. Incluye detalles, capturas de peticiones/respuestas si aplicable y resultados de los tests.

---

## 📌 Estilo y convenciones

- Sigue las guías de estilo oficiales de Kotlin.
- Nombres de clases en **PascalCase**, funciones y variables en **camelCase**.
- Mantén las dependencias actualizadas y elimina las redundantes.
- Documenta las rutas con comentarios sobre parámetros, códigos de estado y ejemplo de solicitudes/respuestas.

---

## 📁 Recursos adicionales

- `TripShareKtor/src/main/resources/application.conf`: configuración del servidor.
- `DATABASE/docker/mysql/init.sql`: script de inicialización de la base de datos.
- `build.gradle.kts`: detalles de dependencias y plugins.
- `settings.gradle.kts`: configuración del proyecto.

---

## ✨ Agradecimientos

Gracias por interesarte en el desarrollo del backend de TripShare. Este proyecto está diseñado para ofrecer una experiencia de desarrollo fluida y una plataforma sólida para la evolución del producto.

¡Esperamos tus contribuciones y sugerencias!

_Teammates de TripShare_