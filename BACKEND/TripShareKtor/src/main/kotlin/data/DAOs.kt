package data

import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime
import org.jetbrains.exposed.sql.javatime.timestamp

// ===========================
// TABLAS (SQL)
// ===========================

object Users : LongIdTable("users", "user_id") {
    val email = varchar("email", 255).uniqueIndex()
    val userName = varchar("user_name", 120)
    val avatarUrl = varchar("avatar_url", 500).nullable()
    val bio = text("bio").nullable()
    val provider = varchar("provider", 20)
    val providerUid = varchar("provider_uid", 255).nullable()
    val passwordHash = varchar("password_hash", 255).nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object FriendRequests : LongIdTable("friend_requests", "request_id") {
    val fromUser = reference("from_user_id", Users)
    val toUser = reference("to_user_id", Users)
    val status = varchar("status", 20).default("pending")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// 👇👇👇 AQUÍ ESTÁ EL ARREGLO DEL CHAT 👇👇👇
object Messages : LongIdTable("messages", "message_id") {
    val fromUser = reference("from_user_id", Users)
    val toUser = reference("to_user_id", Users)
    val content = text("content")
    // USAMOS VARCHAR PARA EVITAR ERRORES DE FECHAS
    val timestamp = varchar("timestamp", 100)
    val isRead = bool("is_read").default(false)
}
// 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

object Trips : LongIdTable("trips", "trip_id") {
    val name = varchar("name", 120)
    val destination = varchar("destination", 120)
    val origin = varchar("origin", 120).nullable()
    val startDate = date("start_date")
    val endDate = date("end_date")
    val createdBy = reference("created_by_user_id", Users)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// ... Tus otras tablas (Activities, Expenses, Memories, TripMembers, TripInvites) ...
// (Pégalas aquí si las tienes, no cambian nada para el chat)
object Activities : LongIdTable("activities", "activity_id") {
    val tripId = reference("trip_id", Trips)
    val createdBy = reference("created_by_user_id", Users)
    val title = varchar("title", 160)
    val description = text("description").nullable()
    val location = varchar("location", 200).nullable()
    val startDatetime = datetime("start_datetime")
    val endDatetime = datetime("end_datetime")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object Expenses : LongIdTable("expenses", "expense_id") {
    val tripId = reference("trip_id", Trips)
    val paidBy = reference("paid_by_user_id", Users)
    val description = varchar("description", 255)
    val amount = decimal("amount", 10, 2)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object Memories : LongIdTable("memories", "memory_id") {
    val tripId = reference("trip_id", Trips)
    val userId = reference("user_id", Users)
    val type = varchar("type", 10)
    val description = text("description").nullable()
    val mediaUrl = varchar("media_url", 500).nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object TripMembers : LongIdTable("trip_members") { // Ojo con la PK compuesta si usas Exposed DAO, LongIdTable fuerza una ID
    val tripId = reference("trip_id", Trips)
    val userId = reference("user_id", Users)
    val role = varchar("role", 20).default("member")
    val joinedAt = timestamp("joined_at").defaultExpression(CurrentTimestamp())
}

object TripInvites : LongIdTable("trip_invites", "invite_id") {
    val tripId = reference("trip_id", Trips)
    val email = varchar("email", 255)
    val token = varchar("token", 64).uniqueIndex()
    val status = varchar("status", 20).default("pending")
    val expiresAt = datetime("expires_at").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// ===========================
// ENTIDADES (DAO)
// ===========================

class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(Users)
    var email by Users.email
    var userName by Users.userName
    var avatarUrl by Users.avatarUrl
    var bio by Users.bio
    var provider by Users.provider
    var createdAt by Users.createdAt
    var passwordHash by Users.passwordHash
}

class TripEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TripEntity>(Trips)
    var name by Trips.name
    var destination by Trips.destination
    var origin by Trips.origin
    var startDate by Trips.startDate
    var endDate by Trips.endDate
    var createdBy by UserEntity referencedOn Trips.createdBy
    var createdAt by Trips.createdAt
}

// Agrega aquí ActivityEntity, ExpenseEntity, etc.
class ActivityEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<ActivityEntity>(Activities)
    var tripId by Activities.tripId
    var title by Activities.title
    var startDatetime by Activities.startDatetime
    var endDatetime by Activities.endDatetime
    var createdBy by UserEntity referencedOn Activities.createdBy
}

class ExpenseEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<ExpenseEntity>(Expenses)
    var tripId by Expenses.tripId
    var paidBy by Expenses.paidBy
    var description by Expenses.description
    var amount by Expenses.amount
    var createdAt by Expenses.createdAt
}

class MemoryEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<MemoryEntity>(Memories)
    var tripId by Memories.tripId
    var userId by Memories.userId
    var type by Memories.type
    var description by Memories.description
    var mediaUrl by Memories.mediaUrl
    var createdAt by Memories.createdAt
}