package plugins

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PingResponse(val ok: Boolean, val message: String)

@Serializable
data class TripDto(
    val id: String,
    val name: String,
    val destination: String,
    val startDate: String, // "YYYY-MM-DD" por ahora
    val endDate: String
)

fun Application.configureRouting() {
    routing {
        route("/api") {

            get("/ping") {
                call.respond(PingResponse(ok = true, message = "Hola desde Ktor"))
            }

            // NUEVO: lista de viajes (mock)
            get("/trips") {
                val trips = listOf(
                    TripDto("t1", "Roma 2026", "Roma", "2026-03-10", "2026-03-15"),
                    TripDto("t2", "Lisboa finde", "Lisboa", "2026-04-02", "2026-04-05")
                )
                call.respond(trips)
            }
        }
    }
}
