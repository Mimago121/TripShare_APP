package com.tuproyecto.plugins

import domain.*
import repository.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.request.receive

fun Application.configureRouting() {
    // Instanciamos el repositorio UNA vez
    val repository = UserRepository()

    routing {
        // --- RUTA RAÍZ ---
        get("/") {
            call.respondText("¡API de TripShare Conectada y Operativa!")
        }

        // ===========================
        // AUTENTICACIÓN
        // ===========================

        // --- LOGIN ---
        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val user = repository.validateUser(request.email, request.pass)

                if (user != null) {
                    call.respond(HttpStatusCode.OK, user)
                } else {
                    call.respond(HttpStatusCode.Unauthorized, "Credenciales incorrectas")
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Error en datos: ${e.message}")
            }
        }

        // --- REGISTER ---
        post("/register") {
            try {
                val request = call.receive<RegisterRequest>()
                println("Registrando: ${request.userName}")

                val success = repository.createUser(request.userName, request.email, request.pass)

                if (success) {
                    call.respond(HttpStatusCode.Created, mapOf("status" to "success"))
                } else {
                    call.respond(HttpStatusCode.Conflict, "El email ya existe")
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Datos inválidos")
            }
        }

        // ===========================
        // USUARIOS
        // ===========================

        // --- OBTENER TODOS LOS USUARIOS ---
        get("/users") {
            try {
                val users = repository.getAllUsers()
                if (users.isNotEmpty()) {
                    call.respond(HttpStatusCode.OK, users)
                } else {
                    call.respond(HttpStatusCode.OK, emptyList<UserModel>())
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, "Error server: ${e.message}")
            }
        }

        // --- OBTENER UN USUARIO POR ID ---
        get("/users/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "ID inválido")
                return@get
            }

            val user = repository.getUserById(id)
            if (user != null) {
                call.respond(HttpStatusCode.OK, user)
            } else {
                call.respond(HttpStatusCode.NotFound, "Usuario no encontrado")
            }
        }

        // --- ACTUALIZAR USUARIO ---
        put("/users/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "ID inválido")
                return@put
            }

            try {
                val request = call.receive<UpdateUserRequest>()
                val updated = repository.updateUser(id, request.userName, request.bio, request.avatarUrl)

                if (updated) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "updated"))
                } else {
                    call.respond(HttpStatusCode.NotFound, "Usuario no encontrado")
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Error al actualizar: ${e.message}")
            }
        }

        // ===========================
        // VIAJES (TRIPS)
        // ===========================
        route("/trips") {
            // GET /trips (Todos)
            get {
                val trips = repository.getAllTrips()
                call.respond(trips)
            }

            // GET /trips/user/{userId} (Por usuario)
            get("/user/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull()
                if (userId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                    return@get
                }
                val trips = repository.getTripsByUserId(userId)
                call.respond(trips)
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest, "ID inválido")
                val trip = repository.getTripById(id)
                if (trip != null) call.respond(HttpStatusCode.OK, trip)
                else call.respond(HttpStatusCode.NotFound, "Viaje no encontrado")
            }

            // 2. Obtener Actividades (Itinerario)
            get("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getActivitiesByTrip(id))
            }

            // 3. Obtener Gastos
            get("/{id}/expenses") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getExpensesByTrip(id))
            }

            // 4. Obtener Memorias
            get("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getMemoriesByTrip(id))
            }

            // POST: Crear Actividad
            post("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<CreateActivityRequest>() // Asegúrate de tener este DTO
                val result = repository.addActivity(id, params.createdByUserId, params.title, params.startDatetime, params.endDatetime)
                if (result != null) call.respond(HttpStatusCode.Created, result)
                else call.respond(HttpStatusCode.BadRequest)
            }

            // POST: Crear Gasto
            post("/{id}/expenses") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    // 👇 CAMBIO IMPORTANTE AQUÍ 👇
                    val params = call.receive<CreateExpenseRequest>()

                    val result = repository.addExpense(id, params.paidByUserId, params.description, params.amount)

                    if (result != null) call.respond(HttpStatusCode.Created, result)
                    else call.respond(HttpStatusCode.BadRequest)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error: ${e.message}")
                }
            }

            // POST: Crear Memoria
            post("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    // 👇 CAMBIO IMPORTANTE AQUÍ 👇
                    val params = call.receive<CreateMemoryRequest>()

                    val result = repository.addMemory(id, params.userId, params.type, params.description, params.mediaUrl)

                    if (result != null) call.respond(HttpStatusCode.Created, result)
                    else call.respond(HttpStatusCode.BadRequest)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error: ${e.message}")
                }
            }

        }

        // ===========================
        // AMIGOS (FRIENDS) - ¡NUEVO!
        // ===========================
        route("/friends") {

            // 1. ENVIAR SOLICITUD: POST /friends/request
            post("/request") {
                try {
                    val params = call.receive<CreateRequestParams>()
                    val success = repository.sendFriendRequest(params.fromId, params.toId)

                    if (success) {
                        call.respond(HttpStatusCode.Created, mapOf("status" to "success"))
                    } else {
                        call.respond(HttpStatusCode.Conflict, "La solicitud ya existe")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error: ${e.message}")
                }
            }

            // 2. VER PENDIENTES: GET /friends/pending/{userId}
            get("/pending/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull()
                if (userId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                    return@get
                }

                try {
                    val requests = repository.getPendingRequestsForUser(userId)
                    call.respond(requests)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error: ${e.message}")
                }
            }

            // 3. ACEPTAR SOLICITUD: PUT /friends/accept/{id}
            put("/accept/{id}") {
                val requestId = call.parameters["id"]?.toLongOrNull()
                if (requestId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                    return@put
                }

                val updated = repository.acceptFriendRequest(requestId)
                if (updated) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "accepted"))
                } else {
                    call.respond(HttpStatusCode.NotFound, "Solicitud no encontrada")
                }
            }

            // 4. RECHAZAR SOLICITUD: DELETE /friends/reject/{id}
            delete("/reject/{id}") {
                val requestId = call.parameters["id"]?.toLongOrNull()
                if (requestId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                    return@delete
                }

                val deleted = repository.rejectFriendRequest(requestId)
                if (deleted) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "rejected"))
                } else {
                    call.respond(HttpStatusCode.NotFound, "Solicitud no encontrada")
                }
            }

            // GET: Obtener mis amigos aceptados -> /friends/accepted/{userId}
            get("/accepted/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull()
                if (userId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                    return@get
                }

                try {
                    val friends = repository.getAcceptedFriends(userId)
                    call.respond(friends)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error: ${e.message}")
                }
            }
        }

        // --- HEALTH CHECK ---
        get("/health") {
            call.respond(mapOf("status" to "OK", "database" to "Connected"))
        }

        // --- CHAT ---
        route("/chat") {
            // Enviar mensaje: POST /chat/send
            post("/send") {
                val params = call.receive<Map<String, String>>()
                val fromId = params["fromId"]?.toLongOrNull()
                val toId = params["toId"]?.toLongOrNull()
                val content = params["content"]

                if (fromId != null && toId != null && content != null) {
                    repository.saveMessage(fromId, toId, content)
                    call.respond(HttpStatusCode.OK, "Mensaje enviado")
                } else {
                    call.respond(HttpStatusCode.BadRequest, "Datos incompletos")
                }
            }

            // Obtener conversación: GET /chat/{myId}/{friendId}
            get("/{myId}/{friendId}") {
                val myId = call.parameters["myId"]?.toLongOrNull()
                val friendId = call.parameters["friendId"]?.toLongOrNull()

                if (myId != null && friendId != null) {
                    val messages = repository.getConversation(myId, friendId)
                    call.respond(messages)
                } else {
                    call.respond(HttpStatusCode.BadRequest, "IDs inválidos")
                }
            }

            get("/notifications/{myId}") {
                val myId = call.parameters["myId"]?.toLongOrNull()
                if (myId != null) {
                    val notifs = repository.getUnreadChatNotifications(myId)
                    call.respond(notifs)
                } else {
                    call.respond(HttpStatusCode.BadRequest, "ID inválido")
                }
            }

            // PUT: Marcar como leído al abrir chat
            put("/read/{myId}/{friendId}") {
                val myId = call.parameters["myId"]?.toLongOrNull()
                val friendId = call.parameters["friendId"]?.toLongOrNull()
                if (myId != null && friendId != null) {
                    repository.markMessagesAsRead(myId, friendId)
                    call.respond(HttpStatusCode.OK, "Leído")
                } else {
                    call.respond(HttpStatusCode.BadRequest, "IDs inválidos")
                }
            }
        }
    }


}