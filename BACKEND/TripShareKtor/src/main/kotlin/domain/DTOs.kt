package domain

import kotlinx.serialization.Serializable

// ===========================
// CHAT (IMPORTANTE: String)
// ===========================
@Serializable
data class MessageDto(
    val id: Long,
    val fromId: Long,
    val toId: Long,
    val content: String,
    val timestamp: String, // <--- ESTO ES LA CLAVE: String
    val isMine: Boolean
)

@Serializable
data class SendMessageRequest(
    val fromId: Long,
    val toId: Long,
    val content: String
)

@Serializable
data class ChatNotificationDto(
    val fromUserId: Long,
    val fromUserName: String,
    val fromUserAvatar: String?,
    val count: Long // Cuántos mensajes sin leer tienes de esta persona
)

// ===========================
// USUARIOS
// ===========================
@Serializable
data class UserModel(
    val id: Long,
    val email: String,
    val userName: String,
    val avatarUrl: String?,
    val bio: String?,
    val provider: String,
    val createdAt: String
)

@Serializable
data class LoginRequest(val email: String, val pass: String)

@Serializable
data class RegisterRequest(val userName: String, val email: String, val pass: String)

@Serializable
data class UpdateUserRequest(val userName: String, val bio: String, val avatarUrl: String)

// ===========================
// AMIGOS
// ===========================
@Serializable
data class FriendRequestDto(
    val id: Long,
    val fromUserName: String,
    val status: String
)

@Serializable
data class CreateRequestParams(val fromId: Long, val toId: Long)

// ===========================
// VIAJES (TRIPS)
// ===========================
@Serializable
data class TripResponse(
    val id: Long, val name: String, val destination: String, val origin: String?,
    val startDate: String, val endDate: String, val createdByUserId: Long
)

@Serializable
data class TripModel( // A veces usas este nombre
    val id: Long, val name: String, val destination: String, val origin: String?,
    val startDate: String, val endDate: String, val createdByUserId: Long
)

// ===========================
// OTROS (Actividades, Gastos, etc)
// ===========================
@Serializable
data class ActivityResponse(
    val id: Long, val tripId: Long, val title: String,
    val startDatetime: String, val endDatetime: String, val createdByUserId: Long
)

@Serializable
data class CreateActivityRequest(
    val tripId: Long, val title: String,
    val startDatetime: String, val endDatetime: String, val createdByUserId: Long
)

@Serializable
data class ExpenseModel(
    val id: Long, val tripId: Long, val paidByUserId: Long,
    val description: String, val amount: Double, val createdAt: String
)

@Serializable
data class MemoryModel(
    val id: Long, val tripId: Long, val userId: Long, val type: String,
    val description: String?, val mediaUrl: String?, val createdAt: String
)

@Serializable
data class CreateExpenseRequest(
    val description: String,
    val amount: Double,
    val paidByUserId: Long
)

@Serializable
data class CreateMemoryRequest(
    val userId: Long,
    val type: String,
    val description: String?,
    val mediaUrl: String?
)

@Serializable
data class CreateTripRequest(
    val name: String,
    val destination: String,
    val origin: String?,       // Puede ser null
    val startDate: String,     // Formato "YYYY-MM-DD"
    val endDate: String,       // Formato "YYYY-MM-DD"
    val createdByUserId: Long
)

@Serializable
data class InvitationResponseRequest(
    val tripId: Long,
    val userId: Long,
    val accept: Boolean
)

@Serializable
data class TripMemberResponse(
    val id: Long,
    val userName: String,
    val email: String,
    val avatarUrl: String?,
    val role: String,   // "owner" o "member"
    val status: String  // "accepted" o "pending"
)

@Serializable
data class VisitedPlaceResponse(
    val id: Long,
    val userId: Long,
    val name: String,
    val latitude: Double,
    val longitude: Double
)

@Serializable
data class CreatePlaceRequest(
    val userId: Long,
    val name: String,
    val latitude: Double,
    val longitude: Double
)