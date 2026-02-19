package routes

import dto.UpdateUserRequest
import repository.UserRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate

fun Route.userRouting(userRepo: UserRepository) {
    route("/users") {
        get {
            call.respond(userRepo.getAllUsers())
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            val user = userRepo.getUserById(id)
            if (user != null) call.respond(user) else call.respond(HttpStatusCode.NotFound)
        }

        authenticate("auth-session") {
            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                val request = call.receive<UpdateUserRequest>()
                if (userRepo.updateUser(id, request.userName, request.bio, request.avatarUrl)) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "updated"))
                } else call.respond(HttpStatusCode.NotFound)
            }
        }
    }
}