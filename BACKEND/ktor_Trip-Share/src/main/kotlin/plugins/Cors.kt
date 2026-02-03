package plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCors() {
    install(CORS) {
        // Permitimos el acceso desde el puerto por defecto de Angular
        allowHost("localhost:4200", schemes = listOf("http"))

        // Métodos HTTP necesarios para un CRUD completo
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)

        // Cabeceras estándar necesarias
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)

        // --- AÑADIDOS NECESARIOS ---

        // Permite enviar JSONs complejos (necesario para POST/PUT desde Angular)
        allowNonSimpleContentTypes = true

        // Si más adelante usas cookies o sesiones, necesitarás esto:
        allowCredentials = true

        // Permite que Angular vea cabeceras personalizadas si las añades en el futuro
        exposeHeader(HttpHeaders.Authorization)
    }
}