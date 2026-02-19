package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import dto.CreatePlaceRequest
import dto.VisitedPlaceResponse
import org.jetbrains.exposed.dao.id.EntityID

class MapRepository {

    // ==========================================
    // 1. CREAR MARCADORES EN EL MAPA
    // ==========================================


    // Guarda una nueva ubicación visitada por un usuario (un pin en el mapa).

    suspend fun addVisitedPlace(req: CreatePlaceRequest): VisitedPlaceResponse = dbQuery {
        VisitedPlaceEntity.new {
            // Relacionamos esta ubicación con el usuario de forma segura
            userId = EntityID(req.userId, Users)
            name = req.name
            latitude = req.latitude
            longitude = req.longitude
        }.let {
            // Convertimos la Entity a DTO para enviarlo al frontend
            VisitedPlaceResponse(
                id = it.id.value,
                userId = it.userId.value,
                name = it.name,
                latitude = it.latitude,
                longitude = it.longitude
            )
        }
    }

    // ==========================================
    // 2. OBTENER MARCADORES
    // ==========================================


    // Recupera todos los lugares que un usuario específico ha guardado en su mapa.

    suspend fun getVisitedPlaces(userId: Long): List<VisitedPlaceResponse> = dbQuery {
        VisitedPlaceEntity.find { VisitedPlaces.userId eq userId }.map {
            VisitedPlaceResponse(
                id = it.id.value,
                userId = it.userId.value,
                name = it.name,
                latitude = it.latitude,
                longitude = it.longitude
            )
        }
    }
}