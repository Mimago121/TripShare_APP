package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import dto.* // Importamos los objetos de transferencia (DTOs)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.sql.insert
import java.time.LocalDateTime

class ActivitiesRepository {

    // ==========================================
    // 1. OBTENER EL ITINERARIO
    // ==========================================


    // Recupera todas las actividades programadas para un viaje específico.

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

    // ==========================================
    // 2. CREAR UNA ACTIVIDAD
    // ==========================================


    // Programa una nueva actividad dentro de un viaje.

    suspend fun addActivity(
        tripId: Long,
        userId: Long,
        title: String,
        start: String,
        end: String
    ): ActivityResponse? = dbQuery {

        // 1. Insertamos usando DSL puro y parseando las fechas al vuelo
        val insert = Activities.insert {
            it[this.tripId] = tripId
            it[this.createdBy] = userId
            it[this.title] = title
            it[this.startDatetime] = LocalDateTime.parse(start) // Conversión String -> Fecha
            it[this.endDatetime] = LocalDateTime.parse(end)     // Conversión String -> Fecha
        }

        // 2. Extraemos el ID recién creado
        val id = insert[Activities.id]

        // 3. Montamos la respuesta
        ActivityResponse(
            id = id.value,
            tripId = tripId,
            title = title,
            startDatetime = start,
            endDatetime = end,
            createdByUserId = userId
        )
    }
}