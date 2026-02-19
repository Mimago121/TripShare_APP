package com.tripshare.repository

import data.Users
import data.* // Importamos las tablas
import domain.* // Importamos los DTOs
import database.DatabaseFactory.dbQuery
import domain.UserModel
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select


class AuthRepository {

suspend fun validateUser(email: String, pass: String): UserModel? = dbQuery {
    Users.select { (Users.email eq email) and (Users.passwordHash eq pass) }
        .map { it.toUserModel() }
        .singleOrNull()
}

suspend fun createUser(name: String, email: String, pass: String): Boolean = dbQuery {
    try {
        Users.insert {
            it[userName] = name
            it[this.email] = email
            it[passwordHash] = pass
            it[provider] = "local"
            it[role] = "user" // Por defecto es usuario normal
        }
        true
    } catch (e: Exception) { false }
}

    private fun ResultRow.toUserModel() = UserModel(
        id = this[Users.id].value,
        email = this[Users.email],
        userName = this[Users.userName],
        avatarUrl = this[Users.avatarUrl],
        bio = this[Users.bio],
        provider = this[Users.provider],
        createdAt = this[Users.createdAt].toString(),
        role = this[Users.role] // <--- AÑADIDO ROL
    )
}
