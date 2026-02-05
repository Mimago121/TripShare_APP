package com.tuproyecto

import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import com.tuproyecto.plugins.*
import database.DatabaseFactory


fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    DatabaseFactory.init()
    configureSerialization()
    configureHTTP()
    configureRouting()
}