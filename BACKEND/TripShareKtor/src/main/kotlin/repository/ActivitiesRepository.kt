package com.tripshare.repository

import data.Activities
import data.ActivityEntity
import database.DatabaseFactory.dbQuery
import domain.ActivityResponse
import org.jetbrains.exposed.sql.insert
import java.time.LocalDateTime

class ActivitiesRepository {
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

    suspend fun addActivity(tripId: Long, userId: Long, title: String, start: String, end: String): ActivityResponse? = dbQuery {
        val insert = Activities.insert {
            it[this.tripId] = tripId
            it[this.createdBy] = userId
            it[this.title] = title
            it[this.startDatetime] = LocalDateTime.parse(start)
            it[this.endDatetime] = LocalDateTime.parse(end)
        }
        val id = insert[Activities.id]
        ActivityResponse(id.value, tripId, title, start, end, userId)
    }
}