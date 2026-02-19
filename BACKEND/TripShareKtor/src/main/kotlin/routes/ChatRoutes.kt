package routes

import repository.ChatRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate

fun Route.chatRouting(chatRepo: ChatRepository) {
    route("/chat") {

        authenticate("auth-session") {
            post("/send") {
                val params = call.receive<Map<String, String>>()
                val fromId = params["fromId"]?.toLongOrNull()
                val toId = params["toId"]?.toLongOrNull()
                val content = params["content"]
                if (fromId != null && toId != null && content != null) {
                    chatRepo.saveMessage(fromId, toId, content)
                    call.respond(HttpStatusCode.OK)
                } else call.respond(HttpStatusCode.BadRequest)
            }
        }
        get("/{myId}/{friendId}") {
            val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            val friendId = call.parameters["friendId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(chatRepo.getConversation(myId, friendId))
        }

        get("/notifications/{myId}") {
            val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(chatRepo.getUnreadChatNotifications(myId))
        }
    }
}