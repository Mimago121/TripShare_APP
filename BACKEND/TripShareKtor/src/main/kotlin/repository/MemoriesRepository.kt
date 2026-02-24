package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import dto.MemoryModel
import org.jetbrains.exposed.sql.insert
import java.time.LocalDateTime

class MemoriesRepository {

    // ==========================================
    // 1. OBTENER RECUERDOS
    // ==========================================


    // Obtiene todos los recuerdos (fotos o notas) asociados a un viaje específico.

    suspend fun getMemoriesByTrip(userId: Long): List<MemoryModel> = dbQuery {
        MemoryEntity.find { Memories.userId eq userId }.map { entity ->
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

    // ==========================================
    // 2. CREAR RECUERDOS
    // ==========================================


    // Sube un nuevo recuerdo al viaje (una foto o un texto).

    suspend fun addMemory(
        tripId: Long,
        userId: Long,
        type: String,
        description: String?,
        url: String?
    ): MemoryModel? = dbQuery {

        // 1. Ejecutamos el INSERT y guardamos la respuesta de la BD en una variable
        val insert = Memories.insert {
            it[this.tripId] = tripId
            it[this.userId] = userId
            it[this.type] = type
            it[this.description] = description
            it[mediaUrl] = mediaUrl
        }

        // 2. Extraemos el ID exacto que MySQL le acaba de asignar a esta fila
        val id = insert[Memories.id]

        // 3. Montamos el DTO de respuesta combinando los datos que nos enviaron
        // junto con el nuevo ID y la hora actual del servidor.
        MemoryModel(
            id = id.value,
            tripId = tripId,
            userId = userId,
            type = type,
            description = description,
            mediaUrl = url,
            createdAt = LocalDateTime.now().toString()
        )
    }
}