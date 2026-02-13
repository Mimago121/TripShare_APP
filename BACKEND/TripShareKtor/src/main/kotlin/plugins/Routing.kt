package com.tuproyecto.plugins

import domain.*
import repository.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.request.receive

fun Application.configureRouting() {
    val repository = UserRepository()

    routing {
        // --- RUTA RAÍZ ---
        get("/") {
            call.respondText("¡API de TripShare Conectada y Operativa!")
        }

        // ===========================
        // AUTENTICACIÓN
        // ===========================
        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val user = repository.validateUser(request.email, request.pass)
                if (user != null) call.respond(HttpStatusCode.OK, user)
                else call.respond(HttpStatusCode.Unauthorized, "Credenciales incorrectas")
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Error en login: ${e.message}")
            }
        }

        post("/register") {
            try {
                val request = call.receive<RegisterRequest>()
                val success = repository.createUser(request.userName, request.email, request.pass)
                if (success) call.respond(HttpStatusCode.Created, mapOf("status" to "success"))
                else call.respond(HttpStatusCode.Conflict, "El email ya existe")
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Error en registro")
            }
        }

        // ===========================
        // USUARIOS
        // ===========================
        route("/users") {
            get {
                val users = repository.getAllUsers()
                call.respond(users)
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest, "ID inválido")
                val user = repository.getUserById(id)
                if (user != null) call.respond(user)
                else call.respond(HttpStatusCode.NotFound)
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                val request = call.receive<UpdateUserRequest>()
                if (repository.updateUser(id, request.userName, request.bio, request.avatarUrl)) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "updated"))
                } else call.respond(HttpStatusCode.NotFound)
            }
        }

        // ===========================
        // VIAJES (TRIPS)
        // ===========================
        route("/trips") {

            // Ver mis invitaciones pendientes
            get("/invitations/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getTripInvitations(userId))
            }

            // Responder invitación (PUT /trips/invitations/respond)
            put("/invitations/respond") {
                try {
                    // Recibimos el objeto tipado directamente
                    val req = call.receive<InvitationResponseRequest>()

                    val success = repository.respondToTripInvitation(req.tripId, req.userId, req.accept)

                    if (success) {
                        call.respond(HttpStatusCode.OK, mapOf("status" to "success"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, "No se encontró el registro")
                    }
                } catch (e: Exception) {
                    println("Error en respond invitation: ${e.message}")
                    call.respond(HttpStatusCode.BadRequest, "Datos inválidos")
                }
            }

            post {
                try {
                    val request = call.receive<CreateTripRequest>()
                    val newTrip = repository.createTrip(request)
                    call.respond(HttpStatusCode.Created, newTrip)
                } catch (e: Exception) {
                    // Imprime el error en la consola de IntelliJ para saber qué falla
                    println("Error creando viaje: ${e.message}")
                    call.respond(HttpStatusCode.BadRequest, "Error al procesar el viaje")
                }
            }

            get { call.respond(repository.getAllTrips()) }

            get("/user/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getTripsByUserId(userId))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                val trip = repository.getTripById(id)
                if (trip != null) call.respond(trip) else call.respond(HttpStatusCode.NotFound)
            }

            // Datos específicos del viaje
            get("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getActivitiesByTrip(id))
            }

            get("/{id}/expenses") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getExpensesByTrip(id))
            }

            get("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getMemoriesByTrip(id))
            }

            get("/{id}/members") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getTripMembers(id))
            }

            // --- INSERCIONES ---
            post("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    val params = call.receive<CreateActivityRequest>()
                    val result = repository.addActivity(id, params.createdByUserId, params.title, params.startDatetime, params.endDatetime)
                    if (result != null) call.respond(HttpStatusCode.Created, result)
                    else call.respond(HttpStatusCode.BadRequest)
                } catch (e: Exception) { call.respond(HttpStatusCode.InternalServerError, e.message ?: "Error") }
            }

            post("/{id}/expenses") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    val params = call.receive<CreateExpenseRequest>()
                    val result = repository.addExpense(id, params.paidByUserId, params.description, params.amount)
                    if (result != null) call.respond(HttpStatusCode.Created, result)
                    else call.respond(HttpStatusCode.BadRequest)
                } catch (e: Exception) { call.respond(HttpStatusCode.BadRequest, e.message ?: "Error") }
            }

            post("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    val params = call.receive<CreateMemoryRequest>()
                    val result = repository.addMemory(id, params.userId, params.type, params.description, params.mediaUrl)
                    if (result != null) call.respond(HttpStatusCode.Created, result)
                    else call.respond(HttpStatusCode.BadRequest)
                } catch (e: Exception) { call.respond(HttpStatusCode.BadRequest) }
            }

            post("/{id}/invite") {
                val tripId = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<Map<String, String>>()
                val email = params["email"] ?: return@post call.respond(HttpStatusCode.BadRequest, "Email requerido")

                if (repository.addMemberByEmail(tripId, email)) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "Invitado correctamente"))
                } else {
                    call.respond(HttpStatusCode.Conflict, "Error al invitar (usuario no existe o ya es miembro)")
                }
            }
        }

        // ===========================
        // AMIGOS (FRIENDS)
        // ===========================
        route("/friends") {
            post("/request") {
                val params = call.receive<CreateRequestParams>()
                if (repository.sendFriendRequest(params.fromId, params.toId)) call.respond(HttpStatusCode.Created)
                else call.respond(HttpStatusCode.Conflict)
            }

            get("/pending/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getPendingRequestsForUser(userId))
            }

            put("/accept/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                if (repository.acceptFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }

            delete("/reject/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                if (repository.rejectFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }

            get("/accepted/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getAcceptedFriends(userId))
            }
        }

        // --- CHAT ---
        route("/chat") {
            post("/send") {
                val params = call.receive<Map<String, String>>()
                val fromId = params["fromId"]?.toLongOrNull()
                val toId = params["toId"]?.toLongOrNull()
                val content = params["content"]
                if (fromId != null && toId != null && content != null) {
                    repository.saveMessage(fromId, toId, content)
                    call.respond(HttpStatusCode.OK)
                } else call.respond(HttpStatusCode.BadRequest)
            }

            get("/{myId}/{friendId}") {
                val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                val friendId = call.parameters["friendId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getConversation(myId, friendId))
            }

            get("/notifications/{myId}") {
                val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getUnreadChatNotifications(myId))
            }

            put("/read/{myId}/{friendId}") {
                val myId = call.parameters["myId"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                val friendId = call.parameters["friendId"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                repository.markMessagesAsRead(myId, friendId)
                call.respond(HttpStatusCode.OK)
            }
        }

        get("/health") { call.respond(mapOf("status" to "OK")) }

        // --- ENDPOINTS DE PINES (MAPA) ---
        route("/places") {
            post {
                val req = call.receive<CreatePlaceRequest>()
                val newPlace = repository.addVisitedPlace(req)
                call.respond(HttpStatusCode.Created, newPlace)
            }

            get("/user/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(repository.getVisitedPlaces(id))
            }
        }
    }
}