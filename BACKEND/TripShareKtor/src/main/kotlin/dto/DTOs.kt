package dto

import io.ktor.server.auth.Principal
import kotlinx.serialization.Serializable

// ==========================================
// 1. CHAT Y NOTIFICACIONES
// ==========================================

@Serializable
data class MessageDto(
    val id: Long,
    val fromId: Long,
    val toId: Long,
    val content: String,
    val timestamp: String,
    val isMine: Boolean // Campo calculado dinámicamente en el backend
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
    val fromUserAvatar: String?, // El '?' significa que puede ser nulo en el JSON
    val count: Long
)

// ==========================================
// 2. USUARIOS Y AUTENTICACIÓN
// ==========================================

@Serializable
data class UserModel(
    val id: Long,
    val email: String,
    val userName: String,
    val avatarUrl: String?,
    val bio: String?,
    val provider: String,
    val createdAt: String,
    val role: String
)

// DTO exclusivo para recibir los datos de inicio de sesión
@Serializable
data class LoginRequest(val email: String, val pass: String)

// DTO exclusivo para recibir los datos de registro
@Serializable
data class RegisterRequest(val userName: String, val email: String, val pass: String)

// DTO exclusivo para actualizar el perfil
@Serializable
data class UpdateUserRequest(val userName: String, val bio: String, val avatarUrl: String)


// Usuario autentificado
@Serializable
data class UserSession(
    val userId: Long,
    val role: String
) : Principal
// ==========================================
// 3. AMIGOS Y RED SOCIAL
// ==========================================

@Serializable
data class FriendRequestDto(
    val id: Long,
    val fromUserName: String,
    val status: String
)

@Serializable
data class CreateRequestParams(val fromId: Long, val toId: Long)

// ==========================================
// 4. VIAJES (TRIPS)
// ==========================================

@Serializable
data class TripResponse(
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long,
    val imageUrl: String?
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
    val budget: Double? = 0.0,
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

// ==========================================
// 5. ACTIVIDADES, GASTOS Y RECUERDOS
// ==========================================

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

// ==========================================
// 6. MAPAS & MENSAJES DE VIAJE GRUPAL
// ==========================================

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
    val imageUrl: String? = null
)

// ==========================================
// 7. PANEL DE ADMINISTRADOR
// ==========================================

@Serializable
data class UserAdminView(
    val id: Long,
    val userName: String,
    val email: String,
    val role: String,
    val trips: List<TripModel> // Usamos modelos de dominio limpios
)

@Serializable
data class MemoryRequest(
    val tripId: Int,
    val userId: Int,
    val type: String,
    val description: String?,
    val mediaUrl: String? // <--- TIENE QUE ESTAR AQUÍ
)