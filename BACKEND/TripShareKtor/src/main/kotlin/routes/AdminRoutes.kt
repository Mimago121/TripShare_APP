package routes

import repository.UserRepository
import repository.TripRepository
import io.ktor.server.application.*
import io.ktor.server.request.* // <--- IMPORTANTE: Necesario para call.receive()
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate
import dto.UserModel
import dto.TripDto  // <--- IMPORTANTE: Ahora que lo añadiste al DTO, esto funcionará

fun Route.adminRouting(userRepo: UserRepository, tripRepo: TripRepository) {

    // 1. DASHBOARD (Datos generales)
    route("/admin") {
        get("/dashboard") {
            try {
                val data = userRepo.getAllUsersWithTrips()
                call.respond(data)
            } catch (e: Exception) {
                e.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, "Error cargando dashboard")
            }
        }
    }

    // 2. GESTIÓN DE USUARIOS (Edición Admin)
    route("/users") {

        // ACTUALIZAR USUARIO
        authenticate("auth-session") {
            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@put call.respond(HttpStatusCode.BadRequest)

                try {
                    val userUpdate = call.receive<UserModel>()
                    // Usamos la función renombrada updateUserAdmin
                    val updated = userRepo.updateUserAdmin(id, userUpdate)

                    if (updated) call.respond(HttpStatusCode.OK, "Usuario actualizado")
                    else call.respond(HttpStatusCode.NotFound, "Usuario no encontrado")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error actualizando: ${e.message}")
                }
            }
        }

        // BORRAR USUARIO
        authenticate("auth-session") {
            delete("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@delete call.respond(HttpStatusCode.BadRequest)

                try {
                    val deleted = userRepo.deleteUser(id)
                    if (deleted) call.respond(HttpStatusCode.OK, "Usuario eliminado")
                    else call.respond(HttpStatusCode.NotFound)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error eliminando usuario: ${e.message}")
                }
            }
        }
    }

    // 3. GESTIÓN DE VIAJES (Edición Admin)
    route("/trips") {

        // ACTUALIZAR VIAJE
        authenticate("auth-session") {
            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@put call.respond(HttpStatusCode.BadRequest)

                try {
                    // Ahora TripDto ya existe y esto funcionará
                    val tripData = call.receive<TripDto>()
                    val updated = tripRepo.updateTrip(id, tripData)

                    if (updated) call.respond(HttpStatusCode.OK, "Viaje actualizado")
                    else call.respond(HttpStatusCode.NotFound, "Viaje no encontrado")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error actualizando viaje: ${e.message}")
                }
            }
        }

        // BORRAR VIAJE
        authenticate("auth-session") {
            delete("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@delete call.respond(HttpStatusCode.BadRequest)

                try {
                    val deleted = tripRepo.deleteTrip(id)
                    if (deleted) call.respond(HttpStatusCode.OK, "Viaje eliminado")
                    else call.respond(HttpStatusCode.NotFound)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error eliminando viaje: ${e.message}")
                }
            }
        }
    }
}