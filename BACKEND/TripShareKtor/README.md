# 6. Documentación de la API

A continuación se detalla la guía de uso de los endpoints para la integración con la aplicación cliente. La API está protegida mediante **Session Authentication**. Todas las operaciones de escritura (POST, PUT, DELETE) requieren que el cliente envíe una Cookie de sesión válida (`USER_SESSION`), obtenida tras hacer login.

---
```json
## 🔐 Autenticación

### "/login"

**POST** - Valida las credenciales del usuario, inicia sesión y devuelve una Cookie de sesión.

#### Parameters
Ninguno

#### Request body

{
  "email": "sergi@gmail.com",
  "pass": "1234"
}

Response (200 OK)

{
  "id": 1,
  "userName": "Sergi",
  "email": "sergi@gmail.com",
  "role": "user"
}

Error Responses

401 Unauthorized: Si la contraseña o el correo son incorrectos. Devuelve "Credenciales incorrectas".

400 Bad Request: Si el JSON enviado está mal formado.

### "/register"

POST - Registra un nuevo usuario en el sistema.

### Parameters
Nothing

### Request body

{
  "userName": "Miriam",
  "email": "miriam@gmail.com",
  "pass": "1234"
}

Response (201 Created)

{
  "status": "success"
}

Error Responses

409 Conflict: Si el email ya está registrado en la base de datos. Devuelve "El email ya existe".

400 Bad Request: Si faltan campos obligatorios.

### "/logout"

POST - Destruye la sesión activa del usuario.

Parameters
Requiere Cookie de sesión activa.

Request body
{}

Response (200 OK)

{
  "status": "Sesión cerrada"
}

Error Responses
401 Unauthorized: Si se intenta hacer logout sin una sesión previa activa.
````
```json
👤 Usuarios
### "/users/{id}"
GET - Recupera la información pública de un usuario mediante su ID.

Parameters
id (Path): ID del usuario.

Request body
{}

Response (200 OK)
JSON
{
  "id": 1,
  "userName": "Sergi",
  "email": "sergi@gmail.com",
  "bio": "Amante de los viajes",
  "avatarUrl": "[https://ui-avatars.com/api/?name=Sergi](https://ui-avatars.com/api/?name=Sergi)"
}

Error Responses

404 Not Found: Si el ID proporcionado no existe en la base de datos.

400 Bad Request: Si el ID no es un número válido.

### "/users/{id}"
PUT - Actualiza el perfil de un usuario.

Parameters
id (Path): ID del usuario.
Requiere Cookie de sesión activa.

Request body

{
  "userName": "SergiViajero",
  "bio": "Nueva biografía",
  "avatarUrl": "[https://example.com/avatar.png](https://example.com/avatar.png)"
}

Response (200 OK)

{
  "status": "updated"
}

Error Responses

401 Unauthorized: Si no se envía la cookie de sesión.

404 Not Found: Si el usuario a actualizar no existe.
```
```JSON
✈️ Viajes (Trips)

### "/trips"
POST - Crea un nuevo viaje.

Parameters
Requiere Cookie de sesión activa.

Request body

{
  "name": "Japón Tecnológico",
  "destination": "Tokio",
  "origin": "Barcelona",
  "startDate": "2026-03-15",
  "endDate": "2026-03-30",
  "createdByUserId": 1
}

Response (201 Created)

{
  "id": 1,
  "name": "Japón Tecnológico",
  "destination": "Tokio",
  "origin": "Barcelona",
  "startDate": "2026-03-15",
  "endDate": "2026-03-30",
  "createdByUserId": 1
}

Error Responses

401 Unauthorized: Falta de sesión.

400 Bad Request: Error al parsear las fechas o datos incompletos. Devuelve "Error al procesar el viaje".

### "/trips/user/{userId}"
GET - Obtiene la lista de viajes a los que pertenece un usuario.

Parameters
userId (Path): ID del usuario.

Request body
{}

Response (200 OK)

[
  {
    "id": 1,
    "name": "Japón Tecnológico",
    "destination": "Tokio",
    "startDate": "2026-03-15",
    "endDate": "2026-03-30"
  }
]

Error Responses

400 Bad Request: Si el userId es nulo o inválido.
```
```JSON
💶 Gastos Compartidos (Expenses)

### "/trips/{id}/expenses"
GET - Obtiene la lista de gastos de un viaje junto con la división de deudas (splits).

Parameters
id (Path): ID del viaje.

Request body
{}

Response (200 OK)

[
  {
    "id": 15,
    "description": "Cena Sushi Ginza",
    "amount": 90.0,
    "paidByUserName": "Sergi",
    "paidById": 1,
    "splits": [
      {
        "userId": 2,
        "userName": "Miriam",
        "amount": 30.0,
        "isPaid": false
      },
      {
        "userId": 3,
        "userName": "Iker",
        "amount": 30.0,
        "isPaid": false
      }
    ]
  }
]

Error Responses

500 Internal Server Error: Fallo transaccional en la base de datos al realizar los JOINs.

400 Bad Request: ID de viaje inválido.

### "/trips/{id}/expenses"
POST - Registra un nuevo gasto y calcula los splits automáticamente.

Parameters
id (Path): ID del viaje.
Requiere Cookie de sesión activa.

Request body

{
  "description": "Cena Sushi Ginza",
  "amount": 90.0,
  "paidByUserId": 1
}

Response (201 Created)

{
  "status": "Gasto creado"
}

Error Responses

401 Unauthorized: Falta de sesión.

400 Bad Request: Si el JSON enviado es incorrecto o hay un error en la base de datos.

500 Internal Server Error: Excepción no controlada en la creación.

### "/trips/expenses/pay"
PUT - Marca la deuda de un usuario en un gasto como pagada.

Parameters
Requiere Cookie de sesión activa.

Request body

{
  "expenseId": 15,
  "userId": 2
}

Response (200 OK)

{
  "status": "success"
}

Error Responses

401 Unauthorized: Falta de sesión.

400 Bad Request: Falta el ID del gasto o del usuario.

500 Internal Server Error: Error al ejecutar el UPDATE en SQL.
```
```JSON
📅 Itinerario (Activities)

### "/trips/{id}/activities"
POST - Añade una actividad al itinerario del viaje.

Parameters
id (Path): ID del viaje.
Requiere Cookie de sesión activa.

Request body

{
  "tripId": 1,
  "title": "Visita Akihabara",
  "startDatetime": "2026-03-16T10:00:00",
  "endDatetime": "2026-03-16T14:00:00",
  "createdByUserId": 1
}

Response (201 Created)

{
  "id": 1,
  "title": "Visita Akihabara"
}

Error Responses

401 Unauthorized: Falta de sesión.

400 Bad Request: Inconsistencia en las fechas enviadas o viaje inexistente.
```
```JSON
🤝 Amigos (Friends)

### "/friends/request"
POST - Envía una solicitud de amistad.

Parameters
Requiere Cookie de sesión activa.

Request body

{
  "fromId": 1,
  "toId": 2
}

Response (201 Created)

{
  "status": "success"
}

Error Responses
401 Unauthorized: Falta de sesión activa.

409 Conflict: Si la solicitud de amistad ya existe previamente (evita duplicados).

### "/friends/accepted/{userId}"
GET - Devuelve la lista de amigos aceptados de un usuario.

Parameters
userId (Path): ID del usuario.

Request body
{}

Response (200 OK)

[
  {
    "id": 2,
    "userName": "Miriam",
    "avatarUrl": "https://..."
  }
]

Error Responses
400 Bad Request: ID de usuario inválido.
```
```JSON
📍 Mapas (Places)
### "/places"
POST - Guarda una nueva ubicación visitada en el mapa del usuario.

Parameters
Requiere Cookie de sesión activa.

Request body

{
  "userId": 1,
  "name": "Sagrada Familia",
  "latitude": 41.4036,
  "longitude": 2.1744
}

Response (201 Created)

{
  "id": 1,
  "name": "Sagrada Familia",
  "latitude": 41.4036,
  "longitude": 2.1744
}

Error Responses
401 Unauthorized: Petición rechazada por falta de sesión.
```
```JSON
👑 Administración

### "/admin/dashboard"
GET - Devuelve un árbol consolidado de usuarios y sus respectivos viajes para el panel de administración.

Parameters
Nothing

Request body
{}

Response (200 OK)

[
  {
    "id": 1,
    "userName": "Sergi",
    "email": "sergi@gmail.com",
    "role": "user",
    "trips": [
      {
        "id": 1,
        "name": "Japón Tecnológico",
        "destination": "Tokio"
      }
    ]
  }
]

Error Responses

500 Internal Server Error: Fallo de agregación SQL o cruce de tablas masivo fallido. Devuelve "Error cargando admin dashboard".