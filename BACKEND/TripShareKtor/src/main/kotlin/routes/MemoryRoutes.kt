package routes

import dto.*
import repository.MemoriesRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*

fun Route.memoryRouting(memoriesRepo: MemoriesRepository) {

    // 1. RUTAS PARA LOS VIAJES (Las que ya tenías)
    route("/trips/{id}/memories") {
        get {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(memoriesRepo.getMemoriesByTrip(id))
        }

        authenticate("auth-session") {
            post {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<CreateMemoryRequest>()
                val res = memoriesRepo.addMemory(id, params.userId, params.type, params.description, params.mediaUrl)
                if (res != null) call.respond(HttpStatusCode.Created, res) else call.respond(HttpStatusCode.BadRequest)
            }
        }
    }

    // 2. NUEVA RUTA PARA EL PERFIL DE USUARIO
    route("/users/{id}/memories") {
        get {
            val userId = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            // Llamamos a la nueva función del repositorio
            call.respond(memoriesRepo.getMemoriesByTrip(userId))
        }
    }
}