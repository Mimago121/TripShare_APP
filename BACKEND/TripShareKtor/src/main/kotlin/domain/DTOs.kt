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
    val timestamp: String,
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
    val count: Long
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
    val createdAt: String,
    val role: String // <--- Asegúrate que esto existe
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
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long,
    val imageUrl: String? // <--- AÑADIDO: Faltaba aquí para getAllTrips
)

@Serializable
data class TripModel(
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long,
    val imageUrl: String? = null
)

@Serializable
data class CreateTripRequest(
    val name: String,
    val destination: String,
    val origin: String? = null,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long,
    val budget: Double? = 0.0, // <--- AÑADIDO: Faltaba el presupuesto
    val imageUrl: String? = null
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
    val role: String,
    val status: String
)

// ===========================
// ACTIVIDADES, GASTOS, ETC
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
data class CreateExpenseRequest(
    val description: String,
    val amount: Double,
    val paidByUserId: Long
)

@Serializable
data class SplitDto(
    val userId: Long,
    val userName: String,
    val amount: Double,
    val isPaid: Boolean
)

@Serializable
data class ExpenseResponse(
    val id: Long,
    val description: String,
    val amount: Double,
    val paidByUserName: String,
    val paidById: Long,
    val splits: List<SplitDto>
)

@Serializable
data class MemoryModel(
    val id: Long, val tripId: Long, val userId: Long, val type: String,
    val description: String?, val mediaUrl: String?, val createdAt: String
)

@Serializable
data class CreateMemoryRequest(
    val userId: Long,
    val type: String,
    val description: String?,
    val mediaUrl: String?
)

// ===========================
// MAPAS & MENSAJES VIAJE
// ===========================
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

@Serializable
data class CreateMessageRequest(
    val userId: Long,
    val content: String
)

@Serializable
data class TripMessageResponse(
    val id: Long,
    val trip_id: Long,
    val user_id: Long,
    val user_name: String,
    val content: String,
    val created_at: String,
    val imageUrl: String? = null // Opcional, por si mandas foto
)

// ===========================
// ADMIN (CORREGIDO)
// ===========================
@Serializable
data class UserAdminView(
    val id: Long,
    val userName: String,
    val email: String,
    val role: String,
    // ERROR ANTERIOR: val trips: List<Trips> -> Trips es la tabla SQL
    // SOLUCIÓN: Usar TripModel
    val trips: List<TripModel>
)