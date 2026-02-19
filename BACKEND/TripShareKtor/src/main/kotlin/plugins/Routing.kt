package com.tuproyecto.plugins

import repository.*
import routes.* // Importamos todos los archivos de rutas que acabamos de crear
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {

    // 1. Instanciamos las dependencias
    val authRepo = AuthRepository()
    val userRepo = UserRepository()
    val tripRepo = TripRepository()
    val activitiesRepo = ActivitiesRepository()
    val expenseRepo = ExpenseRepository()
    val memoriesRepo = MemoriesRepository()
    val friendRepo = FriendRepository()
    val chatRepo = ChatRepository()
    val mapRepo = MapRepository()

    // 2. Orquestamos las rutas
    routing {
        get("/") {
            call.respondText("¡API de TripShare Conectada y Operativa!")
        }

        get("/health") {
            call.respond(mapOf("status" to "OK"))
        }

        // 3. Llamamos a nuestras funciones de extensión inyectando los repositorios
        authRouting(authRepo)
        adminRouting(userRepo)
        userRouting(userRepo)
        tripRouting(tripRepo, activitiesRepo, expenseRepo, memoriesRepo) // Si Trip necesita varios
        friendRouting(friendRepo)
        chatRouting(chatRepo)
        mapRouting(mapRepo)
    }
}