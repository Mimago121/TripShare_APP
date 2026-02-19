package routes

import dto.CreatePlaceRequest
import repository.MapRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate

fun Route.mapRouting(mapRepo: MapRepository) {
    route("/places") {

        authenticate("auth-session") {
            post {
                val req = call.receive<CreatePlaceRequest>()
                val newPlace = mapRepo.addVisitedPlace(req)
                call.respond(HttpStatusCode.Created, newPlace)
            }
        }
        get("/user/{id}") {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(mapRepo.getVisitedPlaces(id))
        }
    }
}