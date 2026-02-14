package repository

import data.* // Importamos las tablas
import domain.* // Importamos los DTOs
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate
import java.time.LocalDateTime

class UserRepository {

    // ==========================================
    // 1. USUARIOS
    // ==========================================
    suspend fun validateUser(email: String, pass: String): UserModel? = dbQuery {
        Users.select { (Users.email eq email) and (Users.passwordHash eq pass) }
            .map { it.toUserModel() }
            .singleOrNull()
    }

    suspend fun createUser(name: String, email: String, pass: String): Boolean = dbQuery {
        try {
            Users.insert {
                it[userName] = name
                it[this.email] = email
                it[passwordHash] = pass
                it[provider] = "local"
            }
            true
        } catch (e: Exception) { false }
    }

    suspend fun updateUser(id: Long, name: String, bio: String, avatarUrl: String): Boolean = dbQuery {
        Users.update({ Users.id eq id }) {
            it[userName] = name
            it[this.bio] = bio
            it[this.avatarUrl] = avatarUrl
        } > 0
    }

    suspend fun getAllUsers(): List<UserModel> = dbQuery {
        UserEntity.all().map { it.toModel() }
    }

    suspend fun getUserById(id: Long): UserModel? = dbQuery {
        UserEntity.findById(id)?.toModel()
    }

    // ==========================================
    // 2. AMIGOS
    // ==========================================
    suspend fun sendFriendRequest(fromId: Long, toId: Long): Boolean = dbQuery {
        val existing = FriendRequests.select {
            ((FriendRequests.fromUser eq fromId) and (FriendRequests.toUser eq toId))
        }.count()
        if (existing > 0) return@dbQuery false

        FriendRequests.insert {
            it[fromUser] = fromId
            it[toUser] = toId
            it[status] = "pending"
        }
        true
    }

    suspend fun getPendingRequestsForUser(userId: Long): List<FriendRequestDto> = dbQuery {
        FriendRequests.join(Users, JoinType.INNER, onColumn = FriendRequests.fromUser, otherColumn = Users.id)
            .slice(FriendRequests.id, Users.userName, FriendRequests.status)
            .select { (FriendRequests.toUser eq userId) and (FriendRequests.status eq "pending") }
            .map {
                FriendRequestDto(
                    id = it[FriendRequests.id].value,
                    fromUserName = it[Users.userName],
                    status = it[FriendRequests.status]
                )
            }
    }

    suspend fun acceptFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.update({ FriendRequests.id eq requestId }) { it[status] = "accepted" } > 0
    }

    suspend fun rejectFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.deleteWhere { FriendRequests.id eq requestId } > 0
    }

    suspend fun getAcceptedFriends(userId: Long): List<UserModel> = dbQuery {
        // 1. Amigos a los que YO invité
        val sentIds = FriendRequests.slice(FriendRequests.toUser)
            .select { (FriendRequests.fromUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.toUser] }

        // 2. Amigos que ME invitaron
        val receivedIds = FriendRequests.slice(FriendRequests.fromUser)
            .select { (FriendRequests.toUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.fromUser] }

        val allFriendIds = (sentIds + receivedIds).distinct()
        if (allFriendIds.isEmpty()) return@dbQuery emptyList()

        // Devolvemos los modelos completos de usuario
        UserEntity.find { Users.id inList allFriendIds }.map { it.toModel() }
    }

    // ==========================================
    // 3. CHAT
    // ==========================================
    suspend fun saveMessage(fromId: Long, toId: Long, content: String): Boolean = dbQuery {
        Messages.insert {
            it[fromUser] = fromId
            it[toUser] = toId
            it[this.content] = content
            it[timestamp] = LocalDateTime.now().toString()
        }
        true
    }

    suspend fun getConversation(myId: Long, friendId: Long): List<MessageDto> = dbQuery {
        Messages.select {
            ((Messages.fromUser eq myId) and (Messages.toUser eq friendId)) or
                    ((Messages.fromUser eq friendId) and (Messages.toUser eq myId))
        }
            .orderBy(Messages.id to SortOrder.ASC)
            .map {
                MessageDto(
                    id = it[Messages.id].value,
                    fromId = it[Messages.fromUser].value,
                    toId = it[Messages.toUser].value,
                    content = it[Messages.content],
                    timestamp = it[Messages.timestamp],
                    isMine = it[Messages.fromUser].value == myId
                )
            }
    }

    suspend fun getUnreadChatNotifications(myId: Long): List<ChatNotificationDto> = dbQuery {
        Messages.join(Users, JoinType.INNER, Messages.fromUser, Users.id)
            .slice(Messages.fromUser, Users.userName, Users.avatarUrl, Messages.id.count())
            .select { (Messages.toUser eq myId) and (Messages.isRead eq false) }
            .groupBy(Messages.fromUser, Users.userName, Users.avatarUrl)
            .map {
                ChatNotificationDto(
                    fromUserId = it[Messages.fromUser].value,
                    fromUserName = it[Users.userName],
                    fromUserAvatar = it[Users.avatarUrl],
                    count = it[Messages.id.count()]
                )
            }
    }

    suspend fun markMessagesAsRead(myId: Long, friendId: Long): Boolean = dbQuery {
        Messages.update({
            (Messages.toUser eq myId) and (Messages.fromUser eq friendId) and (Messages.isRead eq false)
        }) {
            it[isRead] = true
        } > 0
    }

    // ==========================================
    // 4. OTROS (Trips, etc)
    // ==========================================
    suspend fun getAllTrips(): List<TripResponse> = dbQuery {
        TripEntity.all().map { it.toResponse() }
    }

    suspend fun getTripsByUserId(userId: Long): List<TripModel> = dbQuery {
        // 1. Buscamos los IDs de los viajes donde el usuario YA ha aceptado ser miembro
        val acceptedTripIds = TripMembers
            .select {
                (TripMembers.userId eq userId) and (TripMembers.status eq "accepted")
            }
            .map { it[TripMembers.tripId].value }

        // 2. Seleccionamos los viajes:
        //    - Los que yo he creado (soy el dueño)
        //    - O los que he aceptado (están en la lista anterior)
        Trips.select {
            (Trips.createdBy eq userId) or (Trips.id inList acceptedTripIds)
        }.map { row ->
            TripModel(
                id = row[Trips.id].value,
                name = row[Trips.name],
                destination = row[Trips.destination],
                origin = row[Trips.origin],
                startDate = row[Trips.startDate].toString(), // Asegúrate de que el formato sea ISO
                endDate = row[Trips.endDate].toString(),
                createdByUserId = row[Trips.createdBy].value
            )
        }
    }
    suspend fun getTripById(tripId: Long): TripModel? = dbQuery {
        TripEntity.findById(tripId)?.toModel()
    }


    suspend fun createTrip(request: CreateTripRequest): TripModel = dbQuery {
        // 1. Crear el viaje
        val insertStatement = Trips.insert {
            it[name] = request.name
            it[destination] = request.destination
            it[startDate] = LocalDate.parse(request.startDate)
            it[endDate] = LocalDate.parse(request.endDate)
            it[createdBy] = request.createdByUserId
            it[origin] = request.origin
        }
        val newTripId = insertStatement[Trips.id]

        // 2. Añadirte a ti mismo como OWNER y ya ACEPTADO
        TripMembers.insert {
            it[tripId] = newTripId
            it[userId] = request.createdByUserId
            it[role] = "owner"
            it[status] = "accepted" // <--- ¡ESTA LÍNEA ES LA CLAVE!
        }

        TripModel(
            newTripId.value, request.name, request.destination, request.origin,
            request.startDate, request.endDate, request.createdByUserId
        )
    }

    // ===========================
    // GESTIÓN DE MIEMBROS
    // ===========================

    suspend fun getTripMembers(tripId: Long): List<TripMemberResponse> = dbQuery {
        (Users innerJoin TripMembers)
            .select { TripMembers.tripId eq tripId }
            .map {
                TripMemberResponse(
                    id = it[Users.id].value,
                    userName = it[Users.userName],
                    email = it[Users.email],
                    avatarUrl = it[Users.avatarUrl],
                    role = it[TripMembers.role],    // Extraemos el rol
                    status = it[TripMembers.status] // Extraemos el estado
                )
            }
    }

    suspend fun addMemberByEmail(tripId: Long, email: String): Boolean = dbQuery {
        val userRow = Users.select { Users.email eq email }.singleOrNull()
        if (userRow == null) return@dbQuery false

        val userIdToAdd = userRow[Users.id].value

        // Verificamos si ya existe (sea pending o accepted)
        val alreadyExists = TripMembers.select {
            (TripMembers.tripId eq tripId) and (TripMembers.userId eq userIdToAdd)
        }.count() > 0

        if (!alreadyExists) {
            TripMembers.insert {
                it[this.tripId] = tripId
                it[this.userId] = userIdToAdd
                it[this.role] = "member"
                it[this.status] = "pending" // <--- CAMBIO CLAVE: Entra como pendiente
            }
            true
        } else {
            false
        }
    } // <--- ¡AQUÍ FALTABA ESTA LLAVE DE CIERRE!

    // Obtener invitaciones pendientes para un usuario
    suspend fun getTripInvitations(userId: Long): List<TripResponse> = dbQuery {
        (Trips innerJoin TripMembers)
            .select { (TripMembers.userId eq userId) and (TripMembers.status eq "pending") and (TripMembers.role neq "owner")}
            .map {
                TripResponse(
                    id = it[Trips.id].value,
                    name = it[Trips.name],
                    destination = it[Trips.destination],
                    origin = it[Trips.origin],
                    startDate = it[Trips.startDate].toString(),
                    endDate = it[Trips.endDate].toString(),
                    createdByUserId = it[Trips.createdBy].value
                )
            }
    }

    // Responder a una invitación (Aceptar o Rechazar)
    suspend fun respondToTripInvitation(tripId: Long, userId: Long, accept: Boolean): Boolean = dbQuery {
        if (accept) {
            // Si acepta, cambiamos estado a 'accepted'
            TripMembers.update({ (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) }) {
                it[status] = "accepted"
            } > 0
        } else {
            // Si rechaza, borramos la entrada de la tabla
            TripMembers.deleteWhere { (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) } > 0
        }
    }
    // (He eliminado el bloque duplicado de getAcceptedFriends que tenías aquí mal pegado)

    // ==========================================
    // ACTIVIDADES, GASTOS Y MEMORIAS
    // ==========================================

    suspend fun getActivitiesByTrip(tripId: Long): List<ActivityResponse> = dbQuery {
        ActivityEntity.find { Activities.tripId eq tripId }.map { entity ->
            ActivityResponse(
                id = entity.id.value,
                tripId = entity.tripId.value,
                title = entity.title,
                startDatetime = entity.startDatetime.toString(),
                endDatetime = entity.endDatetime.toString(),
                createdByUserId = entity.createdBy.id.value
            )
        }
    }

    suspend fun getExpensesByTrip(tripId: Long): List<ExpenseModel> = dbQuery {
        ExpenseEntity.find { Expenses.tripId eq tripId }.map { entity ->
            ExpenseModel(
                id = entity.id.value,
                tripId = entity.tripId.value,
                paidByUserId = entity.paidBy.value,
                description = entity.description,
                amount = entity.amount.toDouble(),
                createdAt = entity.createdAt.toString()
            )
        }
    }

    suspend fun getMemoriesByTrip(tripId: Long): List<MemoryModel> = dbQuery {
        MemoryEntity.find { Memories.tripId eq tripId }.map { entity ->
            MemoryModel(
                id = entity.id.value,
                tripId = entity.tripId.value,
                userId = entity.userId.value,
                type = entity.type,
                description = entity.description,
                mediaUrl = entity.mediaUrl,
                createdAt = entity.createdAt.toString()
            )
        }
    }

    // ==========================================
    // CREAR DATOS (INSERT)
    // ==========================================

    suspend fun addActivity(tripId: Long, userId: Long, title: String, start: String, end: String): ActivityResponse? = dbQuery {
        val insert = Activities.insert {
            it[this.tripId] = tripId
            it[this.createdBy] = userId
            it[this.title] = title
            it[this.startDatetime] = LocalDateTime.parse(start)
            it[this.endDatetime] = LocalDateTime.parse(end)
        }
        val id = insert[Activities.id]
        ActivityResponse(id.value, tripId, title, start, end, userId)
    }

    fun addExpense(tripId: Long, paidByUserId: Long, description: String, amount: Double): Long? {
        return transaction {
            Expenses.insertAndGetId {
                it[this.tripId] = tripId
                it[this.paidBy] = paidByUserId
                it[this.description] = description
                it[this.amount] = java.math.BigDecimal.valueOf(amount)
            }.value // .value saca el ID Long
        }
    }

    suspend fun addMemory(tripId: Long, userId: Long, type: String, description: String?, url: String?): MemoryModel? = dbQuery {
        val insert = Memories.insert {
            it[this.tripId] = tripId
            it[this.userId] = userId
            it[this.type] = type
            it[this.description] = description
            it[this.mediaUrl] = url
        }
        val id = insert[Memories.id]
        MemoryModel(id.value, tripId, userId, type, description, url, LocalDateTime.now().toString())
    }


    // MAPPERS AUXILIARES
    private fun ResultRow.toUserModel() = UserModel(
        id = this[Users.id].value,
        email = this[Users.email],
        userName = this[Users.userName],
        avatarUrl = this[Users.avatarUrl],
        bio = this[Users.bio],
        provider = this[Users.provider],
        createdAt = this[Users.createdAt].toString()
    )

    private fun UserEntity.toModel() = UserModel(
        id = id.value,
        email = email,
        userName = userName,
        avatarUrl = avatarUrl,
        bio = bio,
        provider = provider,
        createdAt = createdAt.toString()
    )

    private fun TripEntity.toModel() = TripModel(
        id = id.value, name = name, destination = destination, origin = origin,
        startDate = startDate.toString(), endDate = endDate.toString(), createdByUserId = createdBy.id.value
    )

    private fun TripEntity.toResponse() = TripResponse(
        id = id.value, name = name, destination = destination, origin = origin,
        startDate = startDate.toString(), endDate = endDate.toString(), createdByUserId = createdBy.id.value
    )

    // --- SITIOS VISITADOS (Pines del Mapa) ---
    suspend fun addVisitedPlace(req: CreatePlaceRequest): VisitedPlaceResponse = dbQuery {
        VisitedPlaceEntity.new {
            userId = EntityID(req.userId, Users)
            name = req.name
            latitude = req.latitude
            longitude = req.longitude
        }.let {
            VisitedPlaceResponse(it.id.value, it.userId.value, it.name, it.latitude, it.longitude)
        }
    }

    suspend fun getVisitedPlaces(userId: Long): List<VisitedPlaceResponse> = dbQuery {
        VisitedPlaceEntity.find { VisitedPlaces.userId eq userId }.map {
            VisitedPlaceResponse(it.id.value, it.userId.value, it.name, it.latitude, it.longitude)
        }
    }
}