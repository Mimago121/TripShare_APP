package plugins

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PingResponse(val ok: Boolean, val message: String)

fun Application.configureRouting() {
    routing {
        route("/api") {
            get("/ping") {
                call.respond(PingResponse(ok = true, message = "Hola desde Ktor"))
            }
        }
    }
}
