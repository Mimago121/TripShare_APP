package com.tripshare.repository

import data.Memories
import data.MemoryEntity
import database.DatabaseFactory.dbQuery
import domain.MemoryModel
import org.jetbrains.exposed.sql.insert
import java.time.LocalDateTime

class MemoriesRepository {
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
}