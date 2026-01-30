package com.tripshare.backend


import io.ktor.server.application.*
import plugins.configureCors
import plugins.configureRouting
import plugins.configureSerialization

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureCors()
    configureSerialization()
    configureRouting()
}
