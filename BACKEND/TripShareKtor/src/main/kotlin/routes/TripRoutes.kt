package routes

import tables.*
import dto.*
import repository.*
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.auth.authenticate
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.tripRouting(
    tripRepo: TripRepository,
    activitiesRepo: ActivitiesRepository,
    expenseRepo: ExpenseRepository,
    memoriesRepo: MemoriesRepository
) {
    route("/trips") {

        // ==========================================
        //  CHAT GRUPAL
        // ==========================================
        get("/{id}/messages") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id == null) return@get call.respond(HttpStatusCode.BadRequest, "ID inválido")

            try {
                // TODO: Mover a ChatRepository en el futuro
                val messages = transaction {
                    (TripMessages innerJoin Users)
                        .slice(TripMessages.id, TripMessages.tripId, TripMessages.userId, TripMessages.content, TripMessages.createdAt, Users.userName)
                        .select { TripMessages.tripId eq id }
                        .orderBy(TripMessages.createdAt to SortOrder.ASC)
                        .map { row ->
                            TripMessageResponse(
                                id = row[TripMessages.id].value,
                                trip_id = row[TripMessages.tripId].value,
                                user_id = row[TripMessages.userId].value,
                                user_name = row[Users.userName],
                                content = row[TripMessages.content],
                                created_at = row[TripMessages.createdAt].toString()
                            )
                        }
                }
                call.respond(messages)
            } catch (e: Exception) {
                e.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, "Error al cargar chat")
            }
        }

        authenticate("auth-session") {
            post("/{id}/messages") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)

                try {
                    val req = call.receive<CreateMessageRequest>()
                    if (req.content.isBlank()) return@post call.respond(HttpStatusCode.BadRequest, "Mensaje vacío")

                    transaction {
                        TripMessages.insert {
                            it[tripId] = id
                            it[userId] = req.userId
                            it[content] = req.content
                        }
                    }
                    call.respond(HttpStatusCode.Created, mapOf("status" to "Mensaje enviado"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Datos inválidos o JSON mal formado")
                }
            }
        }
        // ==========================================
        //  GESTIÓN DE VIAJES
        // ==========================================
        get { call.respond(tripRepo.getAllTrips()) }

        authenticate("auth-session") {
            post {
                try {
                    val request = call.receive<CreateTripRequest>()
                    val newTrip = tripRepo.createTrip(request)
                    call.respond(HttpStatusCode.Created, newTrip)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error al procesar el viaje")
                }
            }
        }

        get("/user/{userId}") {
            val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(tripRepo.getTripsByUserId(userId))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            val trip = tripRepo.getTripById(id)
            if (trip != null) call.respond(trip) else call.respond(HttpStatusCode.NotFound)
        }

        // ==========================================
        //  INVITACIONES Y MIEMBROS
        // ==========================================
        get("/invitations/{userId}") {
            val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(tripRepo.getTripInvitations(userId))
        }

        authenticate("auth-session") {
            put("/invitations/respond") {
                try {
                    val req = call.receive<InvitationResponseRequest>()
                    val success = tripRepo.respondToTripInvitation(req.tripId, req.userId, req.accept)
                    if (success) call.respond(HttpStatusCode.OK, mapOf("status" to "success"))
                    else call.respond(HttpStatusCode.NotFound)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest)
                }
            }
        }

        authenticate("auth-session") {
            post("/{id}/invite") {
                val tripId =
                    call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<Map<String, String>>()
                val email = params["email"] ?: return@post call.respond(HttpStatusCode.BadRequest)
                if (tripRepo.addMemberByEmail(tripId, email)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.Conflict)
            }
        }

        get("/{id}/members") {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            call.respond(tripRepo.getTripMembers(id))
        }
    }
}