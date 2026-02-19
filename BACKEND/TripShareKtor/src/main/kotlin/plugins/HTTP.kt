package com.tuproyecto.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.CORS

fun Application.configureHTTP() {
    install(CORS) {
        // En lugar de anyHost(), especificamos claramente el de Angular
        allowHost("localhost:4200")

        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)

        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)

        // Si usas allowCredentials, DEBES especificar el host arriba (ya lo hemos hecho)
        allowCredentials = true

        // Esta línea permite que Angular lea las cabeceras de respuesta
        exposeHeader(HttpHeaders.Authorization)
        anyHost()
    }
}