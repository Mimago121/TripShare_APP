package repository

import data.* import domain.* import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

class UserRepository {

    // 1. VALIDAR LOGIN (Cambiado a suspend para usar dbQuery)
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

    // 2. CREAR USUARIO (Corregida la llave que faltaba)
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
        } > 0 // Devuelve true si se actualizó al menos una fila
    }

    // --- FUNCIONES DE USUARIOS ---
    suspend fun getAllUsers(): List<UserModel> = dbQuery {
        UserEntity.all().map { it.toModel() }
    }

    suspend fun getUserById(id: Long): UserModel? = dbQuery {
        UserEntity.findById(id)?.toModel()
    }

    // --- VIAJES ---
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

    // --- ACTIVIDADES ---
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

    // --- GASTOS ---
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

    // --- RECUERDOS ---
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

    // --- MAPEO ---
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