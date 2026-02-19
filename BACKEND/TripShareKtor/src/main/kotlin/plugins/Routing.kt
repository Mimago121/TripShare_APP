package com.tuproyecto.plugins // Asegúrate de que el paquete es el correcto

import com.tripshare.repository.ActivitiesRepository
import com.tripshare.repository.AuthRepository
import com.tripshare.repository.ChatRepository
import com.tripshare.repository.ExpenseRepository
import com.tripshare.repository.FriendRepository
import com.tripshare.repository.MapRepository
import com.tripshare.repository.MemoriesRepository
import com.tripshare.repository.TripRepository
import data.*
import domain.*
import repository.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.request.receive
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

fun Application.configureRouting() {

    // ==========================================
    // INYECCIÓN DE DEPENDENCIAS
    // Aquí instanciamos todos tus nuevos repositorios separados
    // ==========================================
    val authRepo = AuthRepository()
    val userRepo = UserRepository()
    val tripRepo = TripRepository()
    val activitiesRepo = ActivitiesRepository()
    val expenseRepo = ExpenseRepository()
    val memoriesRepo = MemoriesRepository()
    val friendRepo = FriendRepository()
    val chatRepo = ChatRepository()
    val mapRepo = MapRepository() // Si le llamaste de otra forma, cámbialo aquí

    routing {
        // --- RUTA RAÍZ ---
        get("/") {
            call.respondText("¡API de TripShare Conectada y Operativa!")
        }

        // ===========================
        //  RUTAS DE ADMINISTRADOR
        // ===========================
        route("/admin") {
            get("/dashboard") {
                try {
                    val data = userRepo.getAllUsersWithTrips()
                    call.respond(data)
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(HttpStatusCode.InternalServerError, "Error cargando admin dashboard")
                }
            }
        }

        // ===========================
        // AUTENTICACIÓN
        // ===========================
        post("/login") {
            try {
                val request = call.receive<LoginRequest>()
                val user = authRepo.validateUser(request.email, request.pass)
                if (user != null) call.respond(HttpStatusCode.OK, user)
                else call.respond(HttpStatusCode.Unauthorized, "Credenciales incorrectas")
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "Error en login: ${e.message}")
            }
        }

        post("/register") {
            try {
                val request = call.receive<RegisterRequest>()
                val success = authRepo.createUser(request.userName, request.email, request.pass)
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
                call.respond(userRepo.getAllUsers())
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                val user = userRepo.getUserById(id)
                if (user != null) call.respond(user) else call.respond(HttpStatusCode.NotFound)
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                val request = call.receive<UpdateUserRequest>()
                if (userRepo.updateUser(id, request.userName, request.bio, request.avatarUrl)) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "updated"))
                } else call.respond(HttpStatusCode.NotFound)
            }
        }

        // ===========================
        // VIAJES (TRIPS)
        // ===========================
        route("/trips") {

            // ==========================================
            //  CHAT GRUPAL
            // ==========================================
            get("/{id}/messages") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@get call.respond(HttpStatusCode.BadRequest, "ID inválido")

                try {
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

            post("/{id}/messages") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@post call.respond(HttpStatusCode.BadRequest)

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
                    e.printStackTrace()
                    call.respond(HttpStatusCode.BadRequest, "Datos inválidos o JSON mal formado")
                }
            }

            // ==========================================
            //  RESTO DE GESTIÓN DE VIAJES
            // ==========================================

            get { call.respond(tripRepo.getAllTrips()) }

            post {
                try {
                    val request = call.receive<CreateTripRequest>()
                    val newTrip = tripRepo.createTrip(request)
                    call.respond(HttpStatusCode.Created, newTrip)
                } catch (e: Exception) {
                    println("Error creando viaje: ${e.message}")
                    call.respond(HttpStatusCode.BadRequest, "Error al procesar el viaje")
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

            // --- INVITACIONES ---
            get("/invitations/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(tripRepo.getTripInvitations(userId))
            }

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

            post("/{id}/invite") {
                val tripId = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<Map<String, String>>()
                val email = params["email"] ?: return@post call.respond(HttpStatusCode.BadRequest)
                if (tripRepo.addMemberByEmail(tripId, email)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.Conflict)
            }

            // --- DETALLES DEL VIAJE (Actividades, Gastos, Etc) ---

            get("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(activitiesRepo.getActivitiesByTrip(id))
            }
            post("/{id}/activities") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<CreateActivityRequest>()
                val res = activitiesRepo.addActivity(id, params.createdByUserId, params.title, params.startDatetime, params.endDatetime)
                if (res != null) call.respond(HttpStatusCode.Created, res) else call.respond(HttpStatusCode.BadRequest)
            }

            // ==========================================
            //  GASTOS (EXPENSES)
            // ==========================================
            get("/{id}/expenses") {
                val id = call.parameters["id"]?.toLongOrNull()
                if (id == null) return@get call.respond(HttpStatusCode.BadRequest)

                try {
                    val expensesList = transaction {
                        (Expenses innerJoin Users)
                            .slice(Expenses.id, Expenses.description, Expenses.amount, Expenses.paidBy, Users.userName)
                            .select { Expenses.tripId eq id }
                            .map { row ->
                                val expenseId = row[Expenses.id].value

                                val splitsList = (ExpenseSplits innerJoin Users)
                                    .slice(Users.id, Users.userName, ExpenseSplits.shareAmount, ExpenseSplits.isPaid)
                                    .select { ExpenseSplits.expenseId eq expenseId }
                                    .map { splitRow ->
                                        SplitDto(
                                            userId = splitRow[Users.id].value,
                                            userName = splitRow[Users.userName],
                                            amount = splitRow[ExpenseSplits.shareAmount].toDouble(),
                                            isPaid = splitRow[ExpenseSplits.isPaid]
                                        )
                                    }

                                ExpenseResponse(
                                    id = expenseId,
                                    description = row[Expenses.description],
                                    amount = row[Expenses.amount].toDouble(),
                                    paidByUserName = row[Users.userName],
                                    paidById = row[Expenses.paidBy].value,
                                    splits = splitsList
                                )
                            }
                    }
                    call.respond(expensesList)
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(HttpStatusCode.InternalServerError, "Error: ${e.message}")
                }
            }

            post("/{id}/expenses") {
                val tripIdParam = call.parameters["id"]?.toLongOrNull()
                if (tripIdParam == null) return@post call.respond(HttpStatusCode.BadRequest)

                try {
                    val params = call.receive<CreateExpenseRequest>()

                    // Usamos el expenseRepo
                    val newExpenseId = expenseRepo.addExpense(tripIdParam, params.paidByUserId, params.description, params.amount)

                    if (newExpenseId != null) {
                        transaction {
                            val memberIds = TripMembers
                                .slice(TripMembers.userId)
                                .select { TripMembers.tripId eq tripIdParam }
                                .map { it[TripMembers.userId] }

                            val totalMembers = memberIds.size

                            if (totalMembers > 0) {
                                val shareDouble = params.amount / totalMembers
                                val share = java.math.BigDecimal.valueOf(shareDouble)

                                memberIds.forEach { memberId ->
                                    if (memberId.value != params.paidByUserId) {
                                        ExpenseSplits.insert {
                                            it[expenseId] = newExpenseId
                                            it[userId] = memberId
                                            it[shareAmount] = share
                                            it[isPaid] = false
                                        }
                                    }
                                }
                            }
                        }
                        call.respond(HttpStatusCode.Created, mapOf("status" to "Gasto creado"))
                    } else {
                        call.respond(HttpStatusCode.BadRequest, "Error BD")
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    call.respond(HttpStatusCode.InternalServerError)
                }
            }

            put("/expenses/pay") {
                try {
                    val params = call.receive<Map<String, String>>()
                    val expenseId = params["expenseId"]?.toLongOrNull()
                    val userId = params["userId"]?.toLongOrNull()

                    if (expenseId != null && userId != null) {
                        transaction {
                            ExpenseSplits.update({ (ExpenseSplits.expenseId eq expenseId) and (ExpenseSplits.userId eq userId) }) {
                                it[isPaid] = true
                            }
                        }
                        call.respond(HttpStatusCode.OK)
                    } else {
                        call.respond(HttpStatusCode.BadRequest)
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError)
                }
            }

            get("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(memoriesRepo.getMemoriesByTrip(id))
            }
            post("/{id}/memories") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<CreateMemoryRequest>()
                val res = memoriesRepo.addMemory(id, params.userId, params.type, params.description, params.mediaUrl)
                if (res != null) call.respond(HttpStatusCode.Created, res) else call.respond(HttpStatusCode.BadRequest)
            }

            get("/{id}/members") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(tripRepo.getTripMembers(id))
            }
        }

        // ===========================
        // AMIGOS (FRIENDS)
        // ===========================
        route("/friends") {
            post("/request") {
                val params = call.receive<CreateRequestParams>()
                if (friendRepo.sendFriendRequest(params.fromId, params.toId)) call.respond(HttpStatusCode.Created)
                else call.respond(HttpStatusCode.Conflict)
            }

            get("/pending/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(friendRepo.getPendingRequestsForUser(userId))
            }

            put("/accept/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@put call.respond(HttpStatusCode.BadRequest)
                if (friendRepo.acceptFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }

            delete("/reject/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                if (friendRepo.rejectFriendRequest(id)) call.respond(HttpStatusCode.OK)
                else call.respond(HttpStatusCode.NotFound)
            }

            get("/accepted/{userId}") {
                val userId = call.parameters["userId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(friendRepo.getAcceptedFriends(userId))
            }
        }

        // --- CHAT PRIVADO (Usuario a Usuario) ---
        route("/chat") {
            post("/send") {
                val params = call.receive<Map<String, String>>()
                val fromId = params["fromId"]?.toLongOrNull()
                val toId = params["toId"]?.toLongOrNull()
                val content = params["content"]
                if (fromId != null && toId != null && content != null) {
                    chatRepo.saveMessage(fromId, toId, content)
                    call.respond(HttpStatusCode.OK)
                } else call.respond(HttpStatusCode.BadRequest)
            }

            get("/{myId}/{friendId}") {
                val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                val friendId = call.parameters["friendId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(chatRepo.getConversation(myId, friendId))
            }

            get("/notifications/{myId}") {
                val myId = call.parameters["myId"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(chatRepo.getUnreadChatNotifications(myId))
            }
        }

        // ===========================
        // MAPA (VISITED PLACES)
        // ===========================
        route("/places") {
            post {
                val req = call.receive<CreatePlaceRequest>()
                val newPlace = mapRepo.addVisitedPlace(req)
                call.respond(HttpStatusCode.Created, newPlace)
            }

            get("/user/{id}") {
                val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                call.respond(mapRepo.getVisitedPlaces(id))
            }
        }

        get("/health") { call.respond(mapOf("status" to "OK")) }
    }
}