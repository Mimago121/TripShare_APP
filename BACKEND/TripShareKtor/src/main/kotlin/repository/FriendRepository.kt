package com.tripshare.repository

import data.FriendRequests
import data.FriendRequests.fromUser
import data.FriendRequests.status
import data.FriendRequests.toUser
import data.UserEntity
import data.Users
import database.DatabaseFactory.dbQuery
import domain.FriendRequestDto
import domain.UserModel
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update


class FriendRepository {
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

    suspend fun acceptFriendRequest(requestId: Long): Boolean = dbQuery {
        FriendRequests.update ({ FriendRequests.id eq requestId }) { it[status] = "accepted" } > 0
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

}