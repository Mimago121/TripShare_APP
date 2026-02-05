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

        // --- ENDPOINTS DE PRUEBA DE CONEXIÓN ---
        get("/health") {
            call.respond(mapOf("status" to "OK", "database" to "Connected"))
        }

        post("/activities") {
            val request = call.receive<CreateActivityRequest>()
            val newActivity = repository.createActivity(request)
            call.respond(HttpStatusCode.Created, newActivity)
        }
    }
}