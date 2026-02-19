package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import dto.* // Importamos los objetos de transferencia (DTOs)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update

class FriendRepository {

    // ==========================================
    // 1. GESTIÓN DE SOLICITUDES
    // ==========================================


    // Envía una solicitud de amistad de un usuario a otro.

    suspend fun sendFriendRequest(fromId: Long, toId: Long): Boolean = dbQuery {
        val existing = FriendRequests.select {
            ((FriendRequests.fromUser eq fromId) and (FriendRequests.toUser eq toId))
        }.count()

        if (existing > 0) return@dbQuery false // Evita duplicados en la BD

        FriendRequests.insert {
            it[fromUser] = fromId
            it[toUser] = toId
            it[status] = "pending"
        }
        true
    }


    // Acepta una solicitud de amistad pendiente.

    suspend fun acceptFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.update ({ FriendRequests.id eq requestId }) {
            it[status] = "accepted"
        } > 0 // Devuelve true si filas afectadas > 0
    }


    // Rechaza (elimina) una solicitud de amistad.

    suspend fun rejectFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.deleteWhere { FriendRequests.id eq requestId } > 0
    }

    // ==========================================
    // 2. CONSULTAS DE RED SOCIAL
    // ==========================================


    // Obtiene la lista definitiva de amigos de un usuario.

    suspend fun getAcceptedFriends(userId: Long): List<UserModel> = dbQuery {

        // 1. Amigos a los que YO invité
        // Usamos 'slice' para decirle a MySQL que SOLO queremos la columna 'toUser'
        val sentIds = FriendRequests.slice(FriendRequests.toUser)
            .select { (FriendRequests.fromUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.toUser] }

        // 2. Amigos que ME invitaron
        // Usamos 'slice' para decirle a MySQL que SOLO queremos la columna 'fromUser'
        val receivedIds = FriendRequests.slice(FriendRequests.fromUser)
            .select { (FriendRequests.toUser eq userId) and (FriendRequests.status eq "accepted") }
            .map { it[FriendRequests.fromUser] }

        // Unimos ambas listas y eliminamos duplicados por si acaso
        val allFriendIds = (sentIds + receivedIds).distinct()

        if (allFriendIds.isEmpty()) return@dbQuery emptyList()

        // Devolvemos los modelos completos de usuario con una sola consulta IN (...)
        UserEntity.find { Users.id inList allFriendIds }.map { it.toModel() }
    }


    // Obtiene las solicitudes de amistad que le han enviado a este usuario y están pendientes.

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

    // ==========================================
    // 3. FUNCIONES MAPPER (TRADUCTORES)
    // ==========================================


    // Convierte una entidad de base de datos (UserEntity) en un DTO limpio (UserModel).

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
}