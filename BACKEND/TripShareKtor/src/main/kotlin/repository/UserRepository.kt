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

    private fun UserEntity.toModel() = UserModel(
        id = id.value,
        email = email,
        userName = userName,
        avatarUrl = avatarUrl,
        bio = bio,
        provider = provider,
        createdAt = createdAt.toString(),
        role = role // <--- AÑADIDO ROL
    )

    fun getAllUsersWithTrips(): List<UserAdminView> {
        return transaction {
            Users.selectAll().map { userRow ->
                val userId = userRow[Users.id].value

                // Buscamos sus viajes
                val userTrips = (Trips innerJoin TripMembers)
                    .select { TripMembers.userId eq userId }
                    .map { tripRow -> // <--- AQUÍ USAMOS 'tripRow' NO 'row'
                        TripModel(
                            id = tripRow[Trips.id].value,
                            name = tripRow[Trips.name],
                            destination = tripRow[Trips.destination],
                            origin = tripRow[Trips.origin],
                            startDate = tripRow[Trips.startDate].toString(),
                            endDate = tripRow[Trips.endDate].toString(),
                            createdByUserId = tripRow[Trips.createdBy].value,
                            imageUrl = tripRow[Trips.imageUrl] // <--- Incluimos la imagen
                        )
                    }

                UserAdminView(
                    id = userId,
                    userName = userRow[Users.userName],
                    email = userRow[Users.email],
                    role = userRow[Users.role],
                    trips = userTrips
                )
            }
        }
    }
}