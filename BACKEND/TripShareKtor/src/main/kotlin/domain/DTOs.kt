package domain


import kotlinx.serialization.Serializable


@Serializable
data class ExpenseModel(
    val id: Long,
    val tripId: Long,
    val paidByUserId: Long,
    val description: String,
    val amount: Double,
    val createdAt: String
)


// DTOs
@Serializable
data class MemoryModel(
    val id: Long,
    val tripId: Long,
    val userId: Long,
    val type: String,
    val description: String?,
    val mediaUrl: String?,
    val createdAt: String
)



@Serializable
data class TripModel(
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,      // Agregado para resolver el error "No parameter with name 'origin' found"
    val startDate: String,    // Asegúrate de que en el repositorio uses .toString()
    val endDate: String,      // Asegúrate de que en el repositorio uses .toString()
    val createdByUserId: Long
)

@Serializable
data class UserModel(
    val id: Long,
    val email: String,
    val userName: String,
    val avatarUrl: String?,
    val bio: String?,         // Agregado para resolver el error de referencia en el repositorio
    val provider: String,
    val createdAt: String
)


// --- USUARIOS ---
@Serializable
data class UserResponse(
    val id: Long,
    val userName: String,
    val email: String,
    val avatarUrl: String?,
    val bio: String?,
    val createdAt: String
)

// --- VIAJES ---
@Serializable
data class TripResponse(
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long
)

// DTO para cuando tu amigo quiera CREAR un viaje desde Angular
@Serializable
data class CreateTripRequest(
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String,
    val endDate: String,
    val createdByUserId: Long
)

@Serializable
data class ActivityResponse(
    val id: Long, // <--- Asegúrate de que sea Long
    val tripId: Long,
    val title: String,
    val startDatetime: String,
    val endDatetime: String,
    val createdByUserId: Long
)

@Serializable
data class CreateActivityRequest(
    val tripId: Long,
    val title: String,
    val startDatetime: String, // Recibimos el String de la fecha
    val endDatetime: String,
    val createdByUserId: Long
)