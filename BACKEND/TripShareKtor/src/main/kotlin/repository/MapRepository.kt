package com.tripshare.repository

import data.Users
import data.VisitedPlaceEntity
import data.VisitedPlaces
import database.DatabaseFactory.dbQuery
import domain.CreatePlaceRequest
import domain.VisitedPlaceResponse
import org.jetbrains.exposed.dao.id.EntityID

class MapRepository {

    suspend fun addVisitedPlace(req: CreatePlaceRequest): VisitedPlaceResponse = dbQuery {
        VisitedPlaceEntity.new {
            userId = EntityID(req.userId, Users)
            name = req.name
            latitude = req.latitude
            longitude = req.longitude
        }.let {
            VisitedPlaceResponse(it.id.value, it.userId.value, it.name, it.latitude, it.longitude)
        }
    }

    suspend fun getVisitedPlaces(userId: Long): List<VisitedPlaceResponse> = dbQuery {
        VisitedPlaceEntity.find { VisitedPlaces.userId eq userId }.map {
            VisitedPlaceResponse(it.id.value, it.userId.value, it.name, it.latitude, it.longitude)
        }
    }
}