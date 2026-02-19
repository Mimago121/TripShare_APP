package plugins

import dto.UserSession
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.sessions.*

fun Application.configureSecurity() {

    // 1. Configuramos el almacenamiento de la sesión (Cookie)
    install(Sessions) {
        cookie<UserSession>("USER_SESSION") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 3600 * 24 * 7 // La sesión dura 7 días
        }
    }

    // 2. Configuramos el "Guardián" (Authentication Plugin)
    install(Authentication) {
        session<UserSession>("auth-session") {
            validate { session ->
                // Si la sesión existe, la damos por válida
                session
            }
            challenge {
                // Si alguien intenta hacer un POST sin sesión, le devolvemos un 401
                call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "No tienes una sesión activa"))
            }
        }
    }
}