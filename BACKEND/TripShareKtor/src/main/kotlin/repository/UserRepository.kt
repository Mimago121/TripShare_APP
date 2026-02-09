package repository

import data.*
import domain.*
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.* // Importa JoinType, select, insert, etc.
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.time.LocalDateTime

class UserRepository {

    // ==========================================
    // 1. AUTENTICACIÓN Y USUARIOS
    // ==========================================

    suspend fun validateUser(email: String, pass: String): UserModel? = dbQuery {
        Users
            .select { (Users.email eq email) and (Users.passwordHash eq pass) }
            .map {
                UserModel(
                    id = it[Users.id].value,
                    email = it[Users.email],
                    userName = it[Users.userName],
                    avatarUrl = it[Users.avatarUrl],
                    bio = it[Users.bio],
                    provider = it[Users.provider],
                    createdAt = it[Users.createdAt].toString()
                )
            }
            .singleOrNull()
    }

    suspend fun createUser(name: String, email: String, pass: String): Boolean = dbQuery {
        try {
            Users.insert {
                it[this.userName] = name
                it[this.email] = email
                it[this.passwordHash] = pass
                it[this.provider] = "local"
            }
            true
        } catch (e: Exception) {
            println("Error al insertar usuario: ${e.message}")
            false
        }
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
    // 2. SISTEMA DE AMIGOS (FRIENDS)
    // ==========================================

    suspend fun sendFriendRequest(fromId: Long, toId: Long): Boolean = dbQuery {
        // Evitar duplicados
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

    // ESTA FUNCIÓN SOLUCIONA QUE NO SE VEA EL NOMBRE
    suspend fun getPendingRequestsForUser(userId: Long): List<FriendRequestDto> = dbQuery {
        // Hacemos JOIN explícito para obtener el nombre del usuario que ENVÍA (fromUser)
        FriendRequests.join(
            Users,
            JoinType.INNER,
            onColumn = FriendRequests.fromUser,
            otherColumn = Users.id
        )
            .slice(FriendRequests.id, Users.userName, FriendRequests.status)
            .select {
                (FriendRequests.toUser eq userId) and (FriendRequests.status eq "pending")
            }
            .map {
                FriendRequestDto(
                    id = it[FriendRequests.id].value,
                    fromUserName = it[Users.userName], // Aquí obtenemos el nombre correcto
                    status = it[FriendRequests.status]
                )
            }
    }

    suspend fun acceptFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.update({ FriendRequests.id eq requestId }) {
            it[status] = "accepted"
        } > 0
    }

    suspend fun rejectFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.deleteWhere { FriendRequests.id eq requestId } > 0
    }

    // 5. OBTENER LISTA DE AMIGOS (ACEPTADOS)
    suspend fun getAcceptedFriends(userId: Long): List<UserModel> = dbQuery {
        // A) A quienes YO envié y aceptaron
        val sentIds = FriendRequests.slice(FriendRequests.toUser)
            .select { (FriendRequests.fromUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.toUser] }

        // B) Quienes ME enviaron y acepté
        val receivedIds = FriendRequests.slice(FriendRequests.fromUser)
            .select { (FriendRequests.toUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.fromUser] }

        // Unimos las dos listas y quitamos duplicados
        val allFriendIds = (sentIds + receivedIds).distinct()

        if (allFriendIds.isEmpty()) return@dbQuery emptyList()

        // Buscamos los datos de esos usuarios
        UserEntity.find { Users.id inList allFriendIds }.map { it.toModel() }
    }
    // ==========================================
    // 3. VIAJES (TRIPS)
    // ==========================================

    suspend fun getAllTrips(): List<TripResponse> = dbQuery {
        TripEntity.all().map {
            TripResponse(
                id = it.id.value,
                name = it.name,
                destination = it.destination,
                origin = it.origin,
                startDate = it.startDate.toString(),
                endDate = it.endDate.toString(),
                createdByUserId = it.createdBy.id.value
            )
        }
    }

    suspend fun getTripsByUserId(userId: Long): List<TripModel> = dbQuery {
        TripEntity.find { Trips.createdBy eq userId }.map { it.toModel() }
    }

    // ==========================================
    // 4. ACTIVIDADES, GASTOS Y MEMORIAS
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

    suspend fun createActivity(request: CreateActivityRequest): ActivityResponse = dbQuery {
        val entity = ActivityEntity.new {
            tripId = EntityID(request.tripId, Trips)
            createdBy = UserEntity[request.createdByUserId]
            title = request.title
            startDatetime = LocalDateTime.parse(request.startDatetime)
            endDatetime = LocalDateTime.parse(request.endDatetime)
        }

        ActivityResponse(
            id = entity.id.value,
            tripId = entity.tripId.value,
            title = entity.title,
            startDatetime = entity.startDatetime.toString(),
            endDatetime = entity.endDatetime.toString(),
            createdByUserId = entity.createdBy.id.value
        )
    }

    suspend fun getExpensesByTrip(tripId: Long): List<ExpenseModel> = dbQuery {
        ExpenseEntity.find { Expenses.tripId eq tripId }.map {
            ExpenseModel(
                id = it.id.value,
                tripId = it.tripId.value,
                paidByUserId = it.paidBy.value,
                description = it.description,
                amount = it.amount.toDouble(),
                createdAt = it.createdAt.toString()
            )
        }
    }

    suspend fun getMemoriesByTrip(tripId: Long): List<MemoryModel> = dbQuery {
        MemoryEntity.find { Memories.tripId eq tripId }.map {
            MemoryModel(
                id = it.id.value,
                tripId = it.tripId.value,
                userId = it.userId.value,
                type = it.type,
                description = it.description,
                mediaUrl = it.mediaUrl,
                createdAt = it.createdAt.toString()
            )
        }
    }

    // ==========================================
    // 5. FUNCIONES AUXILIARES (MAPPERS)
    // ==========================================

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
        id = id.value,
        name = name,
        destination = destination,
        origin = origin,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        createdByUserId = createdBy.id.value
    )
}