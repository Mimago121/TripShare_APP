package routes

import dto.CreateRequestParams
import repository.FriendRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate

fun Route.friendRouting(friendRepo: FriendRepository) {
    route("/friends") {

        authenticate("auth-session") {
            post("/request") {
                val params = call.receive<CreateRequestParams>()
                if (friendRepo.sendFriendRequest(params.fromId, params.toId)) call.respond(HttpStatusCode.Created)
                else call.respond(HttpStatusCode.Conflict)
            }
        }

        get("/pending/{userId}") {
            val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(friendRepo.getPendingRequestsForUser(userId))
        }

        authenticate("auth-session") {
            put("/accept/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                if (friendRepo.acceptFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }
        }

        authenticate("auth-session") {
            delete("/reject/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                if (friendRepo.rejectFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }
        }

        get("/accepted/{userId}") {
            val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(friendRepo.getAcceptedFriends(userId))
        }
    }
}