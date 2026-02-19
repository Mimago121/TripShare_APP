package routes

import repository.UserRepository
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*

fun Route.adminRouting(userRepo: UserRepository) {
    route("/admin") {
        get("/dashboard") {
            try {
                val data = userRepo.getAllUsersWithTrips()
                call.respond(data)
            } catch (e: Exception) {
                e.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, "Error cargando admin dashboard")
            }
        }
    }
}