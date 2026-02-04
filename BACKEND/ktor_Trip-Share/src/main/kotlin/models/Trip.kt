package models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.timestamp
import kotlinx.serialization.Serializable

object TripsTable : Table("trips") {
    val tripId = long("trip_id").autoIncrement()
    val name = varchar("name", 120)
    val destination = varchar("destination", 120)
    val origin = varchar("origin", 120).nullable()
    val startDate = date("start_date")
    val endDate = date("end_date")
    val createdBy = long("created_by_user_id").references(UsersTable.userId)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(tripId)
}

@Serializable
data class TripDto(
    val id: Long,
    val name: String,
    val destination: String,
    val origin: String?,
    val startDate: String, // Lo enviamos como String para facilitar a Angular
    val endDate: String
)