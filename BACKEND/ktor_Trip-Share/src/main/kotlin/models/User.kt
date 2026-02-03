package models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import kotlinx.serialization.Serializable

// Mapeo de la tabla física de MySQL
object UsersTable : Table("users") {
    val userId = long("user_id").autoIncrement()
    val email = varchar("email", 255).uniqueIndex()
    val userName = varchar("user_name", 120)
    val avatarUrl = varchar("avatar_url", 500).nullable()
    val bio = text("bio").nullable()
    val provider = varchar("provider", 20)
    val providerUid = varchar("provider_uid", 255).nullable()
    val passwordHash = varchar("password_hash", 255).nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(userId)
}

// Objeto de datos (DTO) para enviar a Angular
@Serializable
data class UserDto(
    val id: Long,
    val email: String,
    val userName: String,
    val avatarUrl: String?,
    val bio: String?
)