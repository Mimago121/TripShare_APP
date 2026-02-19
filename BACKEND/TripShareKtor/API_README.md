# API Documentation

A continuación se presenta una guía de uso orientada a desarrolladores del cliente (app móvil/web). Describe los endpoints disponibles, métodos HTTP, ejemplos de petición y respuesta en formato JSON, así como los códigos de estado que la API devuelve.

> Base URL: `http://localhost:8080` (puede cambiarse mediante `application.conf` o variables de entorno)

---

## Autenticación

### `POST /login`
Inicia sesión con correo y contraseña.

**Request body**
```json
{
  "email": "user@example.com",
  "pass": "password123"
}
```

**Response (200 OK)**
```json
{
  "id": 5,
  "email": "user@example.com",
  "userName": "johnDoe",
  "avatarUrl": null,
  "bio": null,
  "provider": "local",
  "createdAt": "2025-12-01T10:00:00",
  "role": "user"
}
```

- **400** Bad request por JSON inválido
- **401** Unauthorized si credenciales incorrectas

### `POST /register`
Registra un nuevo usuario.

**Request body**
```json
{
  "userName": "johnDoe",
  "email": "user@example.com",
  "pass": "password123"
}
```

**Response (201 Created)**
```json
{ "status": "success" }
```

- **409 Conflict** si el email ya existe
- **400 Bad Request** formato inválido

### `POST /logout`
Cierra sesión.

**Request body**: `{}`

**Response (200 OK)**
```json
{ "status": "Sesión cerrada" }
```


---

## Usuarios

### `GET /users`
Obtiene la lista completa de usuarios.

**Response (200 OK)** Array de objetos `UserModel`.

### `GET /users/{id}`
Recupera un usuario por ID.

- **200 OK** con usuario
- **404 Not Found** si no existe

### `PUT /users/{id}` *(requiere autenticación)*
Actualiza información de un usuario.

**Request body**
```json
{
  "userName": "newName",
  "bio": "Nueva biografía",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Response (200 OK)**
```json
{ "status": "updated" }
```

- **400** parámetros inválidos
- **404** usuario no encontrado


---

## Viajes (`/trips`)

### `GET /trips`
Lista todos los viajes.

### `POST /trips` *(autenticado)*
Crea un viaje nuevo.

**Request body**
```json
{
  "name": "Vacaciones",
  "destination": "Roma",
  "origin": "Barcelona",
  "startDate": "2026-04-01",
  "endDate": "2026-04-07",
  "createdByUserId": 1,
  "budget": 1500.0,
  "imageUrl": null
}
```

**Response (201 Created)** Devuelve el `TripResponse` con datos del viaje.

### `GET /trips/user/{userId}`
Viajes asociados a un usuario.

### `GET /trips/{id}`
Detalle de un viaje.

- **404** si no existe


#### Invitaciones y miembros
- `GET /trips/invitations/{userId}`
- `PUT /trips/invitations/respond` *(autenticado)*
  ```json
  { "tripId": 10, "userId": 5, "accept": true }
  ```
- `POST /trips/{id}/invite` *(autenticado)* recibe `{ "email": "a@b.com" }`
- `GET /trips/{id}/members`


#### Chat de viaje
- `GET /trips/{id}/messages`
- `POST /trips/{id}/messages` *(autenticado)*
  ```json
  { "userId": 5, "content": "¡Hola!" }
  ```


---

## Actividades / Gastos / Recuerdos

### Actividades
- `GET /trips/{id}/activities`
- `POST /trips/{id}/activities` *(autenticado)*
  ```json
  {
    "tripId": 3,
    "title": "Museo",
    "startDatetime": "2026-04-02T10:00",
    "endDatetime": "2026-04-02T12:00",
    "createdByUserId": 1
  }
  ```

### Gastos
- `GET /trips/{id}/expenses`
- `POST /trips/{id}/expenses` *(autenticado)*
  ```json
  { "description": "Cena", "amount": 80.0, "paidByUserId": 1 }
  ```
- `PUT /trips/expenses/pay` *(autenticado)*
  ```json
  { "expenseId": 15, "userId": 2 }
  ```

### Recuerdos
- `GET /trips/{id}/memories`
- `POST /trips/{id}/memories` *(autenticado)*
  ```json
  { "userId": 1, "type": "foto", "description": "Atardecer", "mediaUrl": "https://..." }
  ```


---

## Amigos y chat privado

### Amigos
- `POST /friends/request` *(autenticado)*
  ```json
  { "fromId": 1, "toId": 2 }
  ```
- `GET /friends/pending/{userId}`
- `PUT /friends/accept/{id}` *(autenticado)*
- `DELETE /friends/reject/{id}` *(autenticado)*
- `GET /friends/accepted/{userId}`

### Chat uno a uno
- `POST /chat/send` *(autenticado)*
  ```json
  { "fromId":1, "toId":2, "content":"Hola" }
  ```
- `GET /chat/{myId}/{friendId}`
- `GET /chat/notifications/{myId}`


---

## Mapas y lugares

- `POST /places` *(autenticado)*
  ```json
  { "userId":1, "name":"Playa", "latitude":18.5, "longitude":-88.3 }
  ```
- `GET /places/user/{id}`


---

## Administración

- `GET /admin/dashboard` devuelve datos agregados para panel.


---

## Códigos de estado comunes

- `200 OK` – éxito.
- `201 Created` – recurso creado.
- `400 Bad Request` – parámetros inválidos/JSON mal formado.
- `401 Unauthorized` – requiere autenticación.
- `404 Not Found` – recurso no existe.
- `409 Conflict` – conflicto, por ejemplo email duplicado.
- `500 Internal Server Error` – error en servidor.


---

*Este archivo está destinado exclusivamente a la documentación de la API, siguiendo las pautas mencionadas por el profesor.*