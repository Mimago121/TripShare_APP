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

    // SOLUCIÓN 1: Obtiene SOLO los viajes donde el usuario es un miembro ACEPTADO actualmente.
    suspend fun getTripsByUserId(userId: Long): List<TripModel> = dbQuery {
        // 1. Buscamos los IDs de los viajes donde el usuario está dentro y aceptado
        val acceptedTripIds = TripMembers
            .select {
                (TripMembers.userId eq userId) and (TripMembers.status eq "accepted")
            }
            .map { it[TripMembers.tripId].value }

        // Si la lista está vacía (no está en ningún viaje), devolvemos lista vacía rápido
        if (acceptedTripIds.isEmpty()) {
            return@dbQuery emptyList()
        }

        // 2. Traemos SOLO los viajes que coinciden con esos IDs
        Trips.select {
            Trips.id inList acceptedTripIds
        }.map { row ->
            TripModel(
                id = row[Trips.id].value,
                name = row[Trips.name],
                destination = row[Trips.destination],
                origin = row[Trips.origin],
                startDate = row[Trips.startDate].toString(),
                endDate = row[Trips.endDate].toString(),
                createdByUserId = row[Trips.createdBy].value,
                imageUrl = row[Trips.imageUrl]
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
            TripMembers.update({ (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) }) {
                it[status] = "accepted"
            } > 0
        } else {
            TripMembers.deleteWhere { (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) } > 0
        }
    }

    // SOLUCIÓN 2: Eliminación segura con traspaso de poderes y borrado en cascada
    suspend fun removeMemberFromTrip(tripId: Long, userId: Long): Boolean = dbQuery {
        // 1. Averiguamos qué rol tiene el usuario actual
        val currentMemberRow = TripMembers
            .select { (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId) }
            .singleOrNull()

        if (currentMemberRow == null) return@dbQuery false

        val currentRole = currentMemberRow[TripMembers.role]

        // 2. Si es el DUEÑO, hay que buscar sucesor
        if (currentRole == "owner") {
            val heir = TripMembers
                .select {
                    (TripMembers.tripId eq tripId) and
                            (TripMembers.userId neq userId) and
                            (TripMembers.status eq "accepted")
                }
                .orderBy(TripMembers.tripId to SortOrder.ASC) // El más antiguo
                .limit(1)
                .singleOrNull()

            if (heir != null) {
                // A. Hay sucesor, le pasamos el viaje
                val heirUserId = heir[TripMembers.userId]
                Trips.update({ Trips.id eq tripId }) { it[createdBy] = heirUserId }
                TripMembers.update({ (TripMembers.tripId eq tripId) and (TripMembers.userId eq heirUserId) }) { it[role] = "owner" }
            } else {
                // B. No hay sucesor (viaje vacío). Borramos todo en cascada para que no dé error.
                try { Activities.deleteWhere { Activities.tripId eq tripId } } catch (e: Exception) {}
                try { Expenses.deleteWhere { Expenses.tripId eq tripId } } catch (e: Exception) {}
                try { Memories.deleteWhere { Memories.tripId eq tripId } } catch (e: Exception) {}
                try { TripMessages.deleteWhere { TripMessages.tripId eq tripId } } catch (e: Exception) {}

                // Finalmente borramos miembros y viaje
                TripMembers.deleteWhere { TripMembers.tripId eq tripId }
                val deletedTrip = Trips.deleteWhere { Trips.id eq tripId } > 0
                return@dbQuery deletedTrip
            }
        }

        // 3. Borrado del usuario que se va (miembro normal o ex-dueño que ya pasó el poder)
        TripMembers.deleteWhere {
            (TripMembers.tripId eq tripId) and (TripMembers.userId eq userId)
        } > 0
    }

    // Actualizar viaje (ADMIN)
    suspend fun updateTrip(tripId: Long, data: TripDto): Boolean = dbQuery {
        Trips.update({ Trips.id eq tripId }) {
            it[name] = data.name
            it[destination] = data.destination
            it[origin] = data.origin

            // Parseamos las fechas
            it[startDate] = java.time.LocalDate.parse(data.startDate)
            it[endDate] = java.time.LocalDate.parse(data.endDate)
        } > 0
    }

    // Borrar viaje (ADMIN)
    suspend fun deleteTrip(tripId: Long): Boolean = dbQuery {
        Trips.deleteWhere { Trips.id eq tripId } > 0
    }

    // ==========================================
    // 3. FUNCIONES MAPPER (TRADUCTORES)
    // ==========================================

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