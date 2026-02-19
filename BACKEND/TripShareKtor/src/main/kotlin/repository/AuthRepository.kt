package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import dto.* // Importamos los objetos de transferencia (DTOs)
import database.DatabaseFactory.dbQuery
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select

class AuthRepository {

    // ==========================================
    // 1. LOGIN
    // ==========================================


    // Valida las credenciales de un usuario para iniciar sesión.

    suspend fun validateUser(email: String, pass: String): UserModel? = dbQuery {
        Users.select { (Users.email eq email) and (Users.passwordHash eq pass) }
            .map { it.toUserModel() }
            .singleOrNull()
    }

    // ==========================================
    // 2. REGISTRO
    // ==========================================


    // Registra un nuevo usuario en la base de datos.

    suspend fun createUser(name: String, email: String, pass: String): Boolean = dbQuery {
        try {
            Users.insert {
                it[userName] = name
                it[this.email] = email
                it[passwordHash] = pass
                it[provider] = "local"
                it[role] = "user" // Por defecto, nadie nace siendo Admin
            }
            true // Inserción exitosa
        } catch (e: Exception) {
            false // Falló (probablemente por restricción de Email Único)
        }
    }

    // ==========================================
    // 3. FUNCIONES MAPPER (TRADUCTORES)
    // ==========================================


    // Función de extensión para mapear filas puras de SQL (`ResultRow`) a DTOs.

    private fun ResultRow.toUserModel() = UserModel(
        id = this[Users.id].value,
        email = this[Users.email],
        userName = this[Users.userName],
        avatarUrl = this[Users.avatarUrl],
        bio = this[Users.bio],
        provider = this[Users.provider],
        createdAt = this[Users.createdAt].toString(),
        role = this[Users.role] // Extraemos el rol para que el Frontend sepa si es Admin o no
    )
}