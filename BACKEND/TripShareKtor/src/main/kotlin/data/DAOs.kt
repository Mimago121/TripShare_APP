package data


import org.jetbrains.exposed.dao.*
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp


// 1. PRIMERO LAS TABLAS QUE NO DEPENDEN DE NADIE (O SOLO DE USERS)
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

object Trips : LongIdTable("trips", "trip_id") {
    val name = varchar("name", 120)
    val destination = varchar("destination", 120)
    val origin = varchar("origin", 120).nullable()
    val startDate = date("start_date")
    val endDate = date("end_date")
    val createdBy = reference("created_by_user_id", Users)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// DAO Trip
object TripMembers : Table("trip_members") {
    val tripId = reference("trip_id", Trips)
    val userId = reference("user_id", Users)
    val role = varchar("role", 20).default("member")
    val joinedAt = timestamp("joined_at").defaultExpression(CurrentTimestamp())
    override val primaryKey = PrimaryKey(tripId, userId)
}

object Expenses : LongIdTable("expenses", "expense_id") {
    val tripId = reference("trip_id", Trips)
    val paidBy = reference("paid_by_user_id", Users)
    val description = varchar("description", 255)
    val amount = decimal("amount", 10, 2)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object ExpenseSplits : Table("expense_splits") {
    val expenseId = reference("expense_id", Expenses)
    val userId = reference("user_id", Users)
    val shareAmount = decimal("share_amount", 10, 2)
    override val primaryKey = PrimaryKey(expenseId, userId)
}

// 3. Dataclass Entity
class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(Users)

    var email by Users.email
    var userName by Users.userName
    var avatarUrl by Users.avatarUrl
    var bio by Users.bio           // <--- AGREGA ESTA LÍNEA
    var provider by Users.provider
    var providerUid by Users.providerUid
    var passwordHash by Users.passwordHash
    var createdAt by Users.createdAt
}

// Dataclass Trip
class TripEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TripEntity>(Trips)

    var name by Trips.name
    var destination by Trips.destination
    var origin by Trips.origin      // <--- AGREGA ESTA LÍNEA
    var startDate by Trips.startDate // <--- AGREGA ESTA LÍNEA
    var endDate by Trips.endDate     // <--- AGREGA ESTA LÍNEA
    var createdBy by UserEntity referencedOn Trips.createdBy
    var createdAt by Trips.createdAt
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

object Memories : LongIdTable("memories", "memory_id") {
    val tripId = reference("trip_id", Trips)
    val userId = reference("user_id", Users)
    val type = varchar("type", 10)
    val description = text("description").nullable()
    val mediaUrl = varchar("media_url", 500).nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

object TripInvites : LongIdTable("trip_invites", "invite_id") {
    val tripId = reference("trip_id", Trips)
    val email = varchar("email", 255)
    val token = varchar("token", 64).uniqueIndex()
    val status = varchar("status", 20).default("pending")
    val expiresAt = datetime("expires_at").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}
//
class ExpenseEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<ExpenseEntity>(Expenses)

    var tripId by Expenses.tripId
    var paidBy by Expenses.paidBy
    var description by Expenses.description
    var amount by Expenses.amount
    var createdAt by Expenses.createdAt
}

class TripInviteEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TripInviteEntity>(TripInvites)

    var tripId by TripInvites.tripId
    var userId by TripInvites.id
    var status by TripInvites.status
    var createdAt by TripInvites.createdAt
}

class ActivityEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<ActivityEntity>(Activities)
    var tripId by Activities.tripId
    var title by Activities.title
    var startDatetime by Activities.startDatetime
    var endDatetime by Activities.endDatetime
    var createdBy by UserEntity referencedOn Activities.createdBy
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

// ... (Tus otros objetos Users, Trips, etc...)

// 1. DEFINICIÓN DE LA TABLA (Añádelo antes de las clases Entity)
object FriendRequests : LongIdTable("friend_requests", "request_id") {
    val fromUser = reference("from_user_id", Users)
    val toUser = reference("to_user_id", Users)
    val status = varchar("status", 20).default("pending")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// ... (Tus otras clases Entity) ...

// 2. CORRECCIÓN DE LA ENTIDAD (Sustituye tu clase FriendRequestEntity por esta)
class FriendRequestEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<FriendRequestEntity>(FriendRequests)

    var fromUser by UserEntity referencedOn FriendRequests.fromUser // <--- Aquí tenías el error "Frie"
    var toUser by UserEntity referencedOn FriendRequests.toUser
    var status by FriendRequests.status
    var createdAt by FriendRequests.createdAt
}