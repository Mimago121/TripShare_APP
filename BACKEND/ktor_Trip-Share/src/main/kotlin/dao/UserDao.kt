package dao

import models.UserDto
import models.UsersTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class UserDao {

    // 1. OBTENER TODOS LOS USUARIOS
    fun getAllUsers(): List<UserDto> = transaction {
        UsersTable.selectAll().map { rowToUserDto(it) }
    }

    // 2. BUSCAR POR ID (Útil para perfiles)
    fun getUserById(id: Long): UserDto? = transaction {
        UsersTable.select { UsersTable.userId eq id }
            .map { rowToUserDto(it) }
            .singleOrNull()
    }

    // 3. CREAR USUARIO
    fun createUser(user: UserDto): Boolean = transaction {
        UsersTable.insert {
            it[userName] = user.userName
            it[email] = user.email
            it[provider] = "local" // Valor por defecto
            it[passwordHash] = "password_provisional"
            it[createdAt] = java.time.Instant.now()
        }.insertedCount > 0
    }

    // 4. ACTUALIZAR USUARIO
    fun updateUser(id: Long, user: UserDto): Boolean = transaction {
        UsersTable.update({ UsersTable.userId eq id }) {
            it[userName] = user.userName
            it[email] = user.email
            it[avatarUrl] = user.avatarUrl
            it[bio] = user.bio
        } > 0
    }

    // 5. BORRAR USUARIO
    fun deleteUser(id: Long): Boolean = transaction {
        UsersTable.deleteWhere { UsersTable.userId eq id } > 0
    }

    // MAPEO: De fila de base de datos a Objeto Kotlin (DTO)
    private fun rowToUserDto(it: ResultRow) = UserDto(
        id = it[UsersTable.userId],
        email = it[UsersTable.email],
        userName = it[UsersTable.userName],
        avatarUrl = it[UsersTable.avatarUrl],
        bio = it[UsersTable.bio]
    )
}