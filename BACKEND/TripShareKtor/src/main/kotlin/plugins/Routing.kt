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
        // ¡OJO! AQUÍ SE CIERRA EL REGISTER.
        // Antes tenías todo lo de abajo metido aquí dentro.

        // --- OBTENER TODOS LOS USUARIOS (Ahora sí está en /users) ---
        get("/users") {
            try {
                val users = repository.getAllUsers()
                if (users.isNotEmpty()) {
                    call.respond(HttpStatusCode.OK, users)
                } else {
                    // Respondemos lista vacía 200 OK, no error
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
        // --- ENDPOINTS DE VIAJES ---
        route("/trips") {
            // GET /trips
            get {
                val trips = repository.getAllTrips()
                call.respond(trips)
            }

            // GET /trips/user/{userId}
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

        // --- HEALTH CHECK ---
        get("/health") {
            call.respond(mapOf("status" to "OK", "database" to "Connected"))
        }
    }
}