package data // O el paquete que uses, ej: com.tuproyecto.domain

import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
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
    val provider = varchar("provider", 20).default("local") // Default por seguridad
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

// 👇 TABLA DE MENSAJES (Con el arreglo del timestamp string) 👇
object Messages : LongIdTable("messages", "message_id") {
    val fromUser = reference("from_user_id", Users)
    val toUser = reference("to_user_id", Users)
    val content = text("content")
    val timestamp = varchar("timestamp", 100) // String para evitar errores de parseo
    val isRead = bool("is_read").default(false)
}

object Trips : LongIdTable("trips", "trip_id") {
    val name = varchar("name", 120)
    val destination = varchar("destination", 120)
    val origin = varchar("origin", 120).nullable()
    val startDate = date("start_date")
    val endDate = date("end_date")
    val createdBy = reference("created_by_user_id", Users)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

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
    val type = varchar("type", 10) // 'photo' o 'note'
    val description = text("description").nullable()
    val mediaUrl = varchar("media_url", 500).nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// 👇👇👇 CORREGIDO: Usamos Table (no LongIdTable) para la tabla intermedia 👇👇👇
object TripMembers : Table("trip_members") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val role = varchar("role", 20).default("member") // "owner", "member"
    // 👇 NUEVA COLUMNA 👇
    val status = varchar("status", 20).default("pending") // "pending", "accepted", "rejected"

    override val primaryKey = PrimaryKey(tripId, userId)
}

object TripMessages : LongIdTable("trip_messages") { // Nombre exacto de la tabla SQL
    val tripId = reference("trip_id", Trips)
    val userId = reference("user_id", Users)
    val content = text("content")
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
}

object ExpenseSplits : Table("expense_splits") {
    // Claves foráneas
    val expenseId = reference("expense_id", Expenses) // Vincula con la tabla Expenses
    val userId = reference("user_id", Users)       // Vincula con la tabla Users

    // La cantidad que le toca pagar a este usuario (ej: 20.50)
    val shareAmount = decimal("share_amount", 10, 2)
    val isPaid = bool("is_paid").default(false)
    // Clave primaria compuesta (Un usuario solo puede estar una vez en el mismo gasto)
    override val primaryKey = PrimaryKey(expenseId, userId)
}
// ===========================
// ENTIDADES (DAO)
// ===========================
// Estas clases sirven para manejar los datos como objetos.
// TripMembers NO TIENE ENTIDAD DAO porque es una tabla de enlace,
// se usa directamente con Joins en el Repository.

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

object VisitedPlaces : LongIdTable("visited_places") {
    val userId = reference("user_id", Users)
    val name = varchar("name", 255)
    val latitude = double("latitude")
    val longitude = double("longitude")
}

class VisitedPlaceEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<VisitedPlaceEntity>(VisitedPlaces)
    var userId by VisitedPlaces.userId
    var name by VisitedPlaces.name
    var latitude by VisitedPlaces.latitude
    var longitude by VisitedPlaces.longitude
}