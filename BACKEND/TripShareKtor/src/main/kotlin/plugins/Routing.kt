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
    }
}