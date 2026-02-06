package com.tuproyecto.plugins

import domain.*
import repository.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.request.receive

fun Application.configureRouting() {
    val repository = UserRepository()

    routing {
        // Inicio
        get("/") {
            call.respondText("¡API de TripShare Conectada y Operativa!")
        }

        // --- AUTH / LOGIN REAL ---
        route("/login") {
            post {
                try {
                    val request = call.receive<LoginRequest>()

                    // Buscamos al usuario en la base de datos por email y password
                    val user = repository.validateUser(request.email, request.pass)

                    if (user != null) {
                        call.respond(HttpStatusCode.OK, user) // Devolvemos el objeto UserModel completo
                    } else {
                        call.respond(HttpStatusCode.Unauthorized, "Email o contraseña incorrectos")
                    }
                } catch (e: Exception) {
                    // Si llegas aquí es que el JSON está mal formado o falta un campo
                    call.respond(HttpStatusCode.BadRequest, "Error en el formato de datos: ${e.message}")
                }
            }
        }

        // --- ENDPOINTS DE USUARIOS ---
        route("/users") {
            get {
                val users = repository.getAllUsers()
                call.respond(users)
            }

            get("{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID de usuario inválido")
                    return@get
                }
                val user = repository.getUserById(id)
                if (user != null) call.respond(user)
                else call.respond(HttpStatusCode.NotFound, "Usuario no encontrado")
            }
        }

        // --- ENDPOINTS DE VIAJES ---
        route("/trips") {
            get {
                val trips = repository.getAllTrips()
                call.respond(trips)
            }

            get("/user/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull()
                if (userId == null) {
                    call.respond(HttpStatusCode.BadRequest, "ID de usuario inválido")
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