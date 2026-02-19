package tables

import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime
import org.jetbrains.exposed.sql.javatime.timestamp

// ==========================================
// ESQUEMA DE BASE DE DATOS (TABLAS SQL)
// ==========================================

object Users : LongIdTable("users", "user_id") {
    val email = varchar("email", 255).uniqueIndex()
    val userName = varchar("user_name", 120)
    val avatarUrl = text("avatar_url").nullable()
    val bio = text("bio").nullable()
    val provider = varchar("provider", 20).default("local")
    val providerUid = varchar("provider_uid", 255).nullable()
    val passwordHash = varchar("password_hash", 255).nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val role = varchar("role", 20).default("user")
}

object FriendRequests : LongIdTable("friend_requests", "request_id") {
    val fromUser = reference("from_user_id", Users, onDelete = ReferenceOption.CASCADE)
    val toUser = reference("to_user_id", Users, onDelete = ReferenceOption.CASCADE)
    val status = varchar("status", 20).default("pending")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object Messages : LongIdTable("messages", "message_id") {
    val fromUser = reference("from_user_id", Users, onDelete = ReferenceOption.CASCADE)
    val toUser = reference("to_user_id", Users, onDelete = ReferenceOption.CASCADE)
    val content = text("content")
    val timestamp = varchar("timestamp", 100)
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
    val imageUrl = text("image_url").nullable()
}

object Activities : LongIdTable("activities", "activity_id") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val createdBy = reference("created_by_user_id", Users)
    val title = varchar("title", 160)
    val description = text("description").nullable()
    val location = varchar("location", 200).nullable()
    val startDatetime = datetime("start_datetime")
    val endDatetime = datetime("end_datetime")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object Expenses : LongIdTable("expenses", "expense_id") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val paidBy = reference("paid_by_user_id", Users)
    val description = varchar("description", 255)
    val amount = decimal("amount", 10, 2)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object Memories : LongIdTable("memories", "memory_id") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users)
    val type = varchar("type", 10)
    val description = text("description").nullable()
    val mediaUrl = text("media_url").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object TripMembers : Table("trip_members") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val role = varchar("role", 20).default("member")
    val status = varchar("status", 20).default("pending")
    val joinedAt = timestamp("joined_at").defaultExpression(CurrentTimestamp())

    override val primaryKey = PrimaryKey(tripId, userId)
}

object TripMessages : LongIdTable("trip_messages", "id") {
    val tripId = reference("trip_id", Trips, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val content = text("content")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object ExpenseSplits : Table("expense_splits") {
    val expenseId = reference("expense_id", Expenses, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users)
    val shareAmount = decimal("share_amount", 10, 2)
    val isPaid = bool("is_paid").default(false)

    override val primaryKey = PrimaryKey(expenseId, userId)
}

object VisitedPlaces : LongIdTable("visited_places", "id") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val name = varchar("name", 255)
    val latitude = double("latitude")
    val longitude = double("longitude")
}