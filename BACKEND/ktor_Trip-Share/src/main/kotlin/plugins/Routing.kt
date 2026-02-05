package plugins

import dao.TripDao
import dao.UserDao
import models.TripDto
import models.UserDto
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    val tripDao = TripDao()
    val userDao = UserDao()

    routing {
        // --- RUTAS DE VIAJES (TRIPS) ---
        route("/api/trips") {
            // GET ALL
            get {
                val trips = tripDao.getAllTrips()
                call.respond(trips)
            }

            // GET BY ID
            get("{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                val trip = id?.let { tripDao.getTripById(it) }
                if (trip != null) call.respond(trip) else call.respond(HttpStatusCode.NotFound)
            }

            // CREATE (POST)
            post {
                val trip = call.receive<TripDto>()
                // El userId lo enviamos a fuego (1) por ahora hasta que tengas Login
                val success = tripDao.createTrip(trip, 1L)
                if (success) call.respond(HttpStatusCode.Created) else call.respond(HttpStatusCode.InternalServerError)
            }

            // UPDATE (PUT)
            put("{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                val trip = call.receive<TripDto>()
                if (id != null && tripDao.updateTrip(id, trip)) {
                    call.respond(HttpStatusCode.OK)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // DELETE
            delete("{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id != null && tripDao.deleteTrip(id)) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }
        }

        // --- RUTAS DE USUARIOS (USERS) ---
        route("/api/users") {
            get {
                call.respond(userDao.getAllUsers())
            }

            post {
                val user = call.receive<UserDto>()
                if (userDao.createUser(user)) {
                    call.respond(HttpStatusCode.Created)
                } else {
                    call.respond(HttpStatusCode.BadRequest)
                }
            }

            // Puedes añadir aquí el DELETE y PUT de usuarios siguiendo el mismo patrón
        }
    }
}