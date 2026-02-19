package routes

import dto.LoginRequest
import dto.RegisterRequest
import repository.AuthRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*

fun Route.authRouting(authRepo: AuthRepository) {
    post("/login") {
        try {
            val request = call.receive<LoginRequest>()
            val user = authRepo.validateUser(request.email, request.pass)
            if (user != null) call.respond(HttpStatusCode.OK, user)
            else call.respond(HttpStatusCode.Unauthorized, "Credenciales incorrectas")
        } catch (e: Exception) {
            call.respond(HttpStatusCode.BadRequest, "Error en login: ${e.message}")
        }
    }

    post("/register") {
        try {
            val request = call.receive<RegisterRequest>()
            val success = authRepo.createUser(request.userName, request.email, request.pass)
            if (success) call.respond(HttpStatusCode.Created, mapOf("status" to "success"))
            else call.respond(HttpStatusCode.Conflict, "El email ya existe")
        } catch (e: Exception) {
            call.respond(HttpStatusCode.BadRequest, "Error en registro")
        }
    }
}