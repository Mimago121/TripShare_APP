package repository

import database.*
import java.time.*
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq

class UserRepository {

    // --- USUARIOS ---
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
        ActivityEntity.new {
            tripId = EntityID(request.tripId, Trips)
            createdBy = UserEntity[request.createdByUserId]
            title = request.title
            startDatetime = LocalDateTime.parse(request.startDatetime)
            endDatetime = LocalDateTime.parse(request.endDatetime)
        }.let {
            ActivityResponse(
                id = it.id.value, // Aquí aplicas lo mismo que te funcionó antes
                tripId = it.tripId.value,
                title = it.title,
                startDatetime = it.startDatetime.toString(),
                endDatetime = it.endDatetime.toString(),
                createdByUserId = it.createdBy.id.value
            )
        }
    }

    // --- GASTOS (Solo debe haber UNA función con este nombre) ---
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

    // --- RECUERDOS (Solo debe haber UNA función con este nombre) ---
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


    // --- FUNCIONES DE EXTENSIÓN PARA MAPEO ---
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