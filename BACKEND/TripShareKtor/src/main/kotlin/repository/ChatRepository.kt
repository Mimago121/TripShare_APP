package com.tripshare.repository

import data.Messages
import data.Messages.fromUser
import data.Messages.isRead
import data.Messages.timestamp
import data.Messages.toUser
import data.Users
import database.DatabaseFactory.dbQuery
import domain.ChatNotificationDto
import domain.MessageDto
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

class ChatRepository {

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
}