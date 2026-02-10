package repository

import data.* // Importamos las tablas
import domain.* // Importamos los DTOs
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
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
        val sentIds = FriendRequests.slice(FriendRequests.toUser)
            .select { (FriendRequests.fromUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.toUser] }
        val receivedIds = FriendRequests.slice(FriendRequests.fromUser)
            .select { (FriendRequests.toUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.fromUser] }

        val allFriendIds = (sentIds + receivedIds).distinct()
        if (allFriendIds.isEmpty()) return@dbQuery emptyList()

        UserEntity.find { Users.id inList allFriendIds }.map { it.toModel() }
    }

    // ==========================================
    // 3. CHAT (Solución TEXTO para evitar Error 500)
    // ==========================================
    suspend fun saveMessage(fromId: Long, toId: Long, content: String): Boolean = dbQuery {
        Messages.insert {
            it[fromUser] = fromId
            it[toUser] = toId
            it[this.content] = content
            it[timestamp] = LocalDateTime.now().toString() // <--- TEXTO
        }
        true
    }

    suspend fun getConversation(myId: Long, friendId: Long): List<MessageDto> = dbQuery {
        Messages.select {
            ((Messages.fromUser eq myId) and (Messages.toUser eq friendId)) or
                    ((Messages.fromUser eq friendId) and (Messages.toUser eq myId))
        }
            .orderBy(Messages.id to SortOrder.ASC) // Ordenamos por ID (seguro)
            .map {
                MessageDto(
                    id = it[Messages.id].value,
                    fromId = it[Messages.fromUser].value,
                    toId = it[Messages.toUser].value,
                    content = it[Messages.content],
                    timestamp = it[Messages.timestamp], // <--- TEXTO
                    isMine = it[Messages.fromUser].value == myId
                )
            }
    }

    // 1. OBTENER NOTIFICACIONES DE CHAT
    suspend fun getUnreadChatNotifications(myId: Long): List<ChatNotificationDto> = dbQuery {
        // Hacemos JOIN con Users para sacar el nombre y avatar del que envía
        Messages.join(Users, JoinType.INNER, Messages.fromUser, Users.id)
            .slice(
                Messages.fromUser,
                Users.userName,
                Users.avatarUrl,
                Messages.id.count() // Contamos cuántos mensajes hay
            )
            .select {
                (Messages.toUser eq myId) and (Messages.isRead eq false)
            }
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

    // 2. MARCAR COMO LEÍDOS (Cuando abres el chat)
    suspend fun markMessagesAsRead(myId: Long, friendId: Long): Boolean = dbQuery {
        Messages.update({
            (Messages.toUser eq myId) and
                    (Messages.fromUser eq friendId) and
                    (Messages.isRead eq false)
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
        TripEntity.find { Trips.createdBy eq userId }.map { it.toModel() }
    }

    suspend fun getTripById(tripId: Long): TripModel? = dbQuery {
        TripEntity.findById(tripId)?.toModel()
    }

    // ==========================================
    // ACTIVIDADES, GASTOS Y MEMORIAS (ITINERARIO)
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
                amount = entity.amount.toDouble(), // Convertimos a Double para Angular
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
}