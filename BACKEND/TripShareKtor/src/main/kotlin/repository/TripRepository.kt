package repository

import tables.* // Importamos el esquema de la BD (Tablas y DAOs)
import dto.* // Importamos los objetos de transferencia (DTOs)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.time.LocalDate

class TripRepository {

    // ==========================================
    // 1. GESTIÓN DE VIAJES
    // ==========================================


    // Obtiene todos los viajes creados en la plataforma.

    suspend fun getAllTrips(): List<TripResponse> = dbQuery {
        TripEntity.all().map { it.toResponse() }
    }


    // Obtiene los viajes donde un usuario específico participa (como creador o invitado).

    suspend fun getTripsByUserId(userId: Long): List<TripModel> = dbQuery {
        // 1. IDs de viajes donde el usuario es miembro y ha aceptado
        val acceptedTripIds = TripMembers
            .select {
                (TripMembers.userId eq userId) and (TripMembers.status eq "accepted")
            }
            .map { it[TripMembers.tripId].value }

        // 2. Traemos los viajes: los que creó él O los que ha aceptado
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
                imageUrl = row[Trips.imageUrl] // Mapeamos la imagen (puede ser null)
            )
        }
    }


    // Busca un viaje específico por su ID.

    suspend fun getTripById(tripId: Long): TripModel? = dbQuery {
        TripEntity.findById(tripId)?.toModel()
    }


    // Crea un nuevo viaje y asigna automáticamente al creador como 'Administrador' (owner).

    suspend fun createTrip(request: CreateTripRequest): TripModel = dbQuery {
        // 1. Limpieza de datos (evitar URLs con espacios en blanco)
        val finalImageUrl = request.imageUrl?.ifBlank { null }

        // 2. Insertamos el viaje en la BD y recuperamos su ID
        val newTripId = Trips.insertAndGetId {
            it[name] = request.name
            it[destination] = request.destination
            it[origin] = request.origin
            it[startDate] = LocalDate.parse(request.startDate)
            it[endDate] = LocalDate.parse(request.endDate)
            it[createdBy] = request.createdByUserId
            it[imageUrl] = finalImageUrl
        }

        // 3. Añadimos al creador en la tabla intermedia con rol 'owner'
        TripMembers.insert {
            it[tripId] = newTripId
            it[userId] = request.createdByUserId
            it[role] = "owner"
            it[status] = "accepted"
        }

        // 4. Devolvemos el objeto completo para que Angular lo pinte
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

    // ==========================================
    // 2. GESTIÓN DE MIEMBROS E INVITACIONES
    // ==========================================


    // Obtiene la lista completa de personas que participan en un viaje específico.

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


    // Invita a un usuario a un viaje utilizando su correo electrónico.

    suspend fun addMemberByEmail(tripId: Long, email: String): Boolean = dbQuery {
        val userRow = Users.select { Users.email eq email }.singleOrNull()
        if (userRow == null) return@dbQuery false // El usuario no existe

        val userIdToAdd = userRow[Users.id].value

        // Verificamos si ya existe una relación previa (sea pending o accepted)
        val alreadyExists = TripMembers.select {
            (TripMembers.tripId eq tripId) and (TripMembers.userId eq userIdToAdd)
        }.count() > 0

        if (!alreadyExists) {
            TripMembers.insert {
                it[this.tripId] = tripId
                it[this.userId] = userIdToAdd
                it[this.role] = "member"
                it[this.status] = "pending" // Queda pendiente de que el usuario acepte
            }
            true
        } else {
            false
        }
    }


    // Obtiene los viajes a los que un usuario ha sido invitado pero aún no ha respondido.

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
                    imageUrl = it[Trips.imageUrl]
                )
            }
    }


    // Procesa la respuesta de un usuario a una invitación de viaje.

    suspend fun respondToTripInvitation(tripId: Long, userId: Long, accept: Boolean): Boolean = dbQuery {
        if (accept) {
            // Actualiza a aceptado
            TripMembers.update({ (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) }) {
                it[status] = "accepted"
            } > 0
        } else {
            // Elimina la invitación
            TripMembers.deleteWhere { (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) } > 0
        }
    }

    suspend fun removeMemberFromTrip(tripId: Long, userId: Long): Boolean = dbQuery {
        // Asumiendo que tu tabla intermedia se llama TripUsers
        TripMembers.deleteWhere {
            (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId)
        } > 0
    }
    // ==========================================
    // 3. FUNCIONES MAPPER (TRADUCTORES)
    // ==========================================


    // Traduce de Entidad de Base de Datos (`TripEntity`) a DTO Interno (`TripModel`).

    private fun TripEntity.toModel() = TripModel(
        id = id.value,
        name = name,
        destination = destination,
        origin = origin,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        createdByUserId = createdBy.id.value,
        imageUrl = imageUrl
    )


    // Traduce de Entidad de Base de Datos (`TripEntity`) a DTO de Respuesta (`TripResponse`).

    private fun TripEntity.toResponse() = TripResponse(
        id = id.value,
        name = name,
        destination = destination,
        origin = origin,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        createdByUserId = createdBy.id.value,
        imageUrl = imageUrl
    )
}