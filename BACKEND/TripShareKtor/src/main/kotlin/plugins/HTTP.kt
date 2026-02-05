package com.tuproyecto.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.CORS


fun Application.configureHTTP() {
    install(CORS) {
        // Permite que Angular (puerto 4200) acceda a la API
        allowHost("localhost:4200")

        // Métodos que usaremos
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)

        // Cabeceras necesarias para enviar y recibir JSON
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)

        // Importante si vas a usar autenticación más adelante
        allowCredentials = true

        // En desarrollo, esto evita muchos dolores de cabeza
        anyHost()
    }
}