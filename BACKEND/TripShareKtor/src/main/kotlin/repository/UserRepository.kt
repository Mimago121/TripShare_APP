package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import dto.* // Importamos los objetos de transferencia (DTOs)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction


class UserRepository {

    // ==========================================
    // 1. GESTIÓN DE USUARIOS
    // ==========================================


    // Actualiza la información pública del perfil de un usuario.

    suspend fun updateUser(id: Long, name: String, bio: String, avatarUrl: String): Boolean = dbQuery {
        Users.update({ Users.id eq id }) {
            it[userName] = name
            it[this.bio] = bio
            it[this.avatarUrl] = avatarUrl
        } > 0
    }


    // Obtiene una lista con absolutamente todos los usuarios registrados.

    suspend fun getAllUsers(): List<UserModel> = dbQuery {
        UserEntity.all().map { it.toModel() }
    }


    // Busca un usuario específico mediante su ID.

    suspend fun getUserById(id: Long): UserModel? = dbQuery {
        UserEntity.findById(id)?.toModel()
    }


    // ==========================================
    // 2. FUNCIONES MAPPER (TRADUCTORES)
    // ==========================================

    // Traduce de Entidad de Base de Datos (`UserEntity`) a DTO Interno (`UserModel`).

    private fun UserEntity.toModel() = UserModel(
        id = id.value,
        email = email,
        userName = userName,
        avatarUrl = avatarUrl,
        bio = bio,
        provider = provider,
        createdAt = createdAt.toString(),
        role = role
    )


    // ==========================================
    // 3. CONSULTAS AVANZADAS (PANEL ADMIN)
    // ==========================================


    // Genera un informe completo para el Panel de Administrador.

    fun getAllUsersWithTrips(): List<UserAdminView> {
        return transaction {
            // 1. Recorremos todas las filas de la tabla Usuarios
            Users.selectAll().map { userRow ->
                val userId = userRow[Users.id].value

                // 2. Buscamos los viajes de ESTE usuario cruzando 2 tablas (Join)
                val userTrips = (Trips innerJoin TripMembers)
                    .select { TripMembers.userId eq userId }
                    .map { tripRow ->
                        // Convertimos la fila del viaje en un objeto TripModel
                        TripModel(
                            id = tripRow[Trips.id].value,
                            name = tripRow[Trips.name],
                            destination = tripRow[Trips.destination],
                            origin = tripRow[Trips.origin],
                            startDate = tripRow[Trips.startDate].toString(),
                            endDate = tripRow[Trips.endDate].toString(),
                            createdByUserId = tripRow[Trips.createdBy].value,
                            imageUrl = tripRow[Trips.imageUrl]
                        )
                    }

                // 3. Empaquetamos al usuario junto con su lista de viajes
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

    // Actualizar datos del usuario (ADMIN)
    suspend fun updateUserAdmin(userId: Long, data: UserModel): Boolean = dbQuery {
        Users.update({ Users.id eq userId }) {
            it[userName] = data.userName
            it[email] = data.email
            it[role] = data.role
        } > 0
    }

    suspend fun deleteUser(userId: Long): Boolean = dbQuery {
        // 1. Borrar sus solicitudes de amistad (enviadas o recibidas)
        FriendRequests.deleteWhere {
            (fromUser eq userId) or (toUser eq userId)
        }

        // 2. Borrar su participación en viajes (Tabla intermedia)
        TripMembers.deleteWhere {
            TripMembers.userId eq userId
        }

        // 3. (Opcional) Borrar mensajes de chat si tienes tabla de mensajes
        // Messages.deleteWhere { fromId eq userId } ...

        // 4. (Opcional) Si el usuario es Creador de viajes, ¿borramos los viajes?
        // Si decides borrarlos:
        // Trips.deleteWhere { createdBy eq userId }

        // 5. FINALMENTE, borramos al usuario
        Users.deleteWhere { Users.id eq userId } > 0
    }
}