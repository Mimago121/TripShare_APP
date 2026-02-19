package routes

import dto.*
import repository.ActivitiesRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*

fun Route.activityRouting(activitiesRepo: ActivitiesRepository) {
    route("/trips/{id}/activities") {

        get {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(activitiesRepo.getActivitiesByTrip(id))
        }

        authenticate("auth-session") {
            post {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<CreateActivityRequest>()
                val res = activitiesRepo.addActivity(id, params.createdByUserId, params.title, params.startDatetime, params.endDatetime)
                if (res != null) call.respond(HttpStatusCode.Created, res) else call.respond(HttpStatusCode.BadRequest)
            }
        }
    }
}