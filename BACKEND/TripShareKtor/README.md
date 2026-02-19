# 🌍 TripShare API - Backend

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)
![Ktor](https://img.shields.io/badge/ktor-%23087CFA.svg?style=for-the-badge&logo=ktor&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Exposed](https://img.shields.io/badge/JetBrains_Exposed-Black?style=for-the-badge&logo=jetbrains)

Backend RESTful de **TripShare**, una plataforma colaborativa para planificar viajes, gestionar gastos, chatear y compartir recuerdos entre amigos. Desarrollado 100% en Kotlin utilizando el framework **Ktor** y **JetBrains Exposed** como ORM.

## 🏗️ Arquitectura y Principios de Diseño

Este proyecto ha sido refactorizado y diseñado siguiendo los principios **SOLID** (específicamente el Principio de Responsabilidad Única) y aplicando conceptos de **Clean Architecture** y **Domain-Driven Design (DDD)**.

El código está estrictamente modularizado para garantizar la escalabilidad, la separación de responsabilidades (Separation of Concerns) y la mantenibilidad:

```text
📁 src/main/kotlin/
 ├── 📁 database/   # Configuración de HikariCP y conexión asíncrona a MySQL.
 ├── 📁 dto/        # Data Transfer Objects. Contratos estrictos (Requests/Responses) para aislar la capa de red del dominio.
 ├── 📁 entities/   # Objetos DAO (Data Access Objects) de Exposed para mapeo ORM.
 ├── 📁 plugins/    # Orquestación de Ktor, Inyección de Dependencias manual y configuración del servidor.
 ├── 📁 repository/ # Lógica de negocio y consultas transaccionales (Patrón Repository).
 ├── 📁 routes/     # Endpoints HTTP limpios. Reciben peticiones, delegan en repositorios y devuelven respuestas.
 └── 📁 tables/     # Definición del esquema relacional (DSL de Exposed).

✨ Características Principales (Módulos de Dominio)
La API está dividida en 8 repositorios independientes, cada uno gestionando un dominio específico:

🔐 Autenticación (AuthRepository): Registro y validación de usuarios con control de errores por índices únicos.

👤 Usuarios y Panel Admin (UserRepository): Gestión de perfiles y consultas avanzadas con cruce de tablas (JOINs) para el Dashboard de Administración.

🤝 Red Social (FriendRepository): Gestión bidireccional de amistades (envío, aceptación y rechazo de solicitudes).

✈️ Viajes (TripRepository): CRUD de viajes grupales, roles de miembros (owner/member) e invitaciones mediante validación de email.

💬 Chat y Notificaciones (ChatRepository): Mensajería en tiempo real entre usuarios y chat grupal por viaje. Implementa agregaciones SQL (GROUP BY, COUNT) para optimizar el cálculo de notificaciones no leídas.

💶 Gastos Compartidos (ExpenseRepository): Registro de pagos y división automática de deudas. Utiliza tipos DECIMAL (mediante BigDecimal) para garantizar precisión financiera total sin errores de coma flotante.

📅 Itinerario (ActivitiesRepository): Gestión de la agenda del viaje mediante parseo estricto de fechas (ISO 8601 a LocalDateTime).

📍 Mapas (MapRepository): Geoposicionamiento de lugares visitados utilizando coordenadas precisas.

📸 Recuerdos (MemoriesRepository): Almacenamiento ágil de notas e imágenes (mediante codificación Base64 en campos LONGTEXT).

🛠️ Stack Tecnológico
Lenguaje: Kotlin (Corrutinas para asincronía).

Framework Web: Ktor Server.

Base de Datos: MySQL.

ORM / Query Builder: JetBrains Exposed (Hibridación inteligente entre el API DAO para lectura y el API DSL para inserciones de alto rendimiento).

Serialización: kotlinx.serialization para el manejo de JSON seguro.

💡 Puntos Técnicos Destacados
Seguridad contra bloqueos (Non-blocking): Todas las transacciones a base de datos están envueltas en la función dbQuery que ejecuta las consultas en un Dispatcher.IO, evitando bloquear el hilo principal del servidor Ktor.

Integridad Relacional Fuerte: Uso exhaustivo de restricciones de clave foránea (ON DELETE CASCADE y ON DELETE RESTRICT) gestionadas desde código Kotlin.

Prevención N+1: Uso de Eager Loading y JOINs nativos para evitar saturar la base de datos con consultas repetitivas (ej: cargar perfiles de usuario junto con notificaciones de chat).

Capa DTO Aislada: Las entidades de base de datos nunca viajan al frontend. Se traducen en la capa Repository a DTOs seguros ocultando información sensible (como passwordHash).

🚀 Instalación y Ejecución
Clonar el repositorio.

Configurar una base de datos MySQL local o remota.

Ejecutar el script SQL de inicialización proporcionado (database_setup.sql) para crear el esquema y poblar los datos semilla (Seed Data).

Ajustar las credenciales en DatabaseFactory.kt (o mediante variables de entorno).

Ejecutar la función main en Application.kt o compilar mediante Gradle: ./gradlew run.

El servidor iniciará en http://localhost:8080.