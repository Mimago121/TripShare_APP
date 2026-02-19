package com.tripshare.repository

import data.TripEntity
import data.TripMembers
import data.TripMembers.role
import data.TripMembers.status
import data.TripMembers.tripId
import data.TripMembers.userId
import data.Trips
import data.Trips.createdBy
import data.Trips.destination
import data.Trips.endDate
import data.Trips.imageUrl
import data.Trips.name
import data.Trips.origin
import data.Trips.startDate
import data.Users
import database.DatabaseFactory.dbQuery
import domain.CreateTripRequest
import domain.TripMemberResponse
import domain.TripModel
import domain.TripResponse
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update
import java.time.LocalDate

class TripRepository {

    suspend fun getAllTrips(): List<TripResponse> = dbQuery {
        TripEntity.all().map { it.toResponse() }
    }

    suspend fun getTripsByUserId(userId: Long): List<TripModel> = dbQuery {
        // 1. Buscamos los IDs de los viajes donde el usuario YA ha aceptado ser miembro
        val acceptedTripIds = TripMembers
            .select {
                (TripMembers.userId eq userId) and (TripMembers.status eq "accepted")
            }
            .map { it[TripMembers.tripId].value }

        // 2. Seleccionamos los viajes
        Trips.select {
            (Trips.createdBy eq userId) or (Trips.id inList acceptedTripIds)
        }.map { row ->
            TripModel(
                id = row[Trips.id].value,
                name = row[Trips.name],
                destination = row[Trips.destination],
                origin = row[Trips.origin],
                startDate = row[Trips.startDate].toString(),
                endDate = row[Trips.endDate].toString(),
                createdByUserId = row[Trips.createdBy].value,
                imageUrl = row[Trips.imageUrl] // <--- AÑADIDO: Mapeamos la imagen
            )
        }
    }

    suspend fun getTripById(tripId: Long): TripModel? = dbQuery {
        TripEntity.findById(tripId)?.toModel()
    }


    suspend fun createTrip(request: CreateTripRequest): TripModel = dbQuery {

        // 1. LIMPIEZA: Si la URL está vacía o son espacios, la convertimos a NULL
        val finalImageUrl = request.imageUrl?.ifBlank { null }

        // 2. INSERTAR Y OBTENER ID
        val newTripId = Trips.insertAndGetId {
            it[name] = request.name
            it[destination] = request.destination
            it[origin] = request.origin
            it[startDate] = LocalDate.parse(request.startDate)
            it[endDate] = LocalDate.parse(request.endDate)
            it[createdBy] = request.createdByUserId
            it[imageUrl] = finalImageUrl
        }

        // 3. AÑADIRTE COMO MIEMBRO (OWNER)
        TripMembers.insert {
            it[tripId] = newTripId
            it[userId] = request.createdByUserId
            it[role] = "owner"
            it[status] = "accepted"
        }

        // 4. DEVOLVER EL MODELO
        TripModel(
            id = newTripId.value,
            name = request.name,
            destination = request.destination,
            origin = request.origin,
            startDate = request.startDate,
            endDate = request.endDate,
            createdByUserId = request.createdByUserId,
            imageUrl = finalImageUrl
        )
    }

    // ===========================
    // GESTIÓN DE MIEMBROS
    // ===========================

    suspend fun getTripMembers(tripId: Long): List<TripMemberResponse> = dbQuery {
        (Users innerJoin TripMembers)
            .select { TripMembers.tripId eq tripId }
            .map {
                TripMemberResponse(
                    id = it[Users.id].value,
                    userName = it[Users.userName],
                    email = it[Users.email],
                    avatarUrl = it[Users.avatarUrl],
                    role = it[TripMembers.role],
                    status = it[TripMembers.status]
                )
            }
    }

    suspend fun addMemberByEmail(tripId: Long, email: String): Boolean = dbQuery {
        val userRow = Users.select { Users.email eq email }.singleOrNull()
        if (userRow == null) return@dbQuery false

        val userIdToAdd = userRow[Users.id].value

        // Verificamos si ya existe
        val alreadyExists = TripMembers.select {
            (TripMembers.tripId eq tripId) and (TripMembers.userId eq userIdToAdd)
        }.count() > 0

        if (!alreadyExists) {
            TripMembers.insert {
                it[this.tripId] = tripId
                it[this.userId] = userIdToAdd
                it[this.role] = "member"
                it[this.status] = "pending"
            }
            true
        } else {
            false
        }
    }

    // Obtener invitaciones pendientes para un usuario
    suspend fun getTripInvitations(userId: Long): List<TripResponse> = dbQuery {
        (Trips innerJoin TripMembers)
            .select { (TripMembers.userId eq userId) and (TripMembers.status eq "pending") and (TripMembers.role neq "owner")}
            .map {
                TripResponse(
                    id = it[Trips.id].value,
                    name = it[Trips.name],
                    destination = it[Trips.destination],
                    origin = it[Trips.origin],
                    startDate = it[Trips.startDate].toString(),
                    endDate = it[Trips.endDate].toString(),
                    createdByUserId = it[Trips.createdBy].value,
                    imageUrl = it[Trips.imageUrl] // Añadido
                )
            }
    }

    // Responder a una invitación (Aceptar o Rechazar)
    suspend fun respondToTripInvitation(tripId: Long, userId: Long, accept: Boolean): Boolean = dbQuery {
        if (accept) {
            TripMembers.update({ (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) }) {
                it[status] = "accepted"
            } > 0
        } else {
            TripMembers.deleteWhere { (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) } > 0
        }
    }


    private fun TripEntity.toModel() = TripModel(
        id = id.value,
        name = name,
        destination = destination,
        origin = origin,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        createdByUserId = createdBy.id.value,
        imageUrl = imageUrl // <--- AÑADIDA IMAGEN
    )

    private fun TripEntity.toResponse() = TripResponse(
        id = id.value,
        name = name,
        destination = destination,
        origin = origin,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        createdByUserId = createdBy.id.value,
        imageUrl = imageUrl // <--- AÑADIDA IMAGEN
    )
}