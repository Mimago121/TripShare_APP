package dao

import models.TripDto
import models.TripsTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate

class TripDao {
    // GET ALL
    fun getAllTrips(): List<TripDto> = transaction {
        TripsTable.selectAll().map { rowToTripDto(it) }
    }

    // GET ONE
    fun getTripById(id: Long): TripDto? = transaction {
        TripsTable.select { TripsTable.tripId eq id }
            .map { rowToTripDto(it) }
            .singleOrNull()
    }

    // CREATE
    fun createTrip(trip: TripDto, userId: Long): Boolean = transaction {
        val result = TripsTable.insert {
            it[name] = trip.name
            it[destination] = trip.destination
            it[origin] = trip.origin
            it[startDate] = LocalDate.parse(trip.startDate)
            it[endDate] = LocalDate.parse(trip.endDate)
            it[createdBy] = userId
            it[createdAt] = java.time.Instant.now()
        }
        result.insertedCount > 0
    }

    // UPDATE
    fun updateTrip(id: Long, trip: TripDto): Boolean = transaction {
        TripsTable.update({ TripsTable.tripId eq id }) {
            it[name] = trip.name
            it[destination] = trip.destination
            it[origin] = trip.origin
            it[startDate] = LocalDate.parse(trip.startDate)
            it[endDate] = LocalDate.parse(trip.endDate)
        } > 0
    }

    // DELETE
    fun deleteTrip(id: Long): Boolean = transaction {
        TripsTable.deleteWhere { TripsTable.tripId eq id } > 0
    }

    private fun rowToTripDto(it: ResultRow) = TripDto(
        id = it[TripsTable.tripId],
        name = it[TripsTable.name],
        destination = it[TripsTable.destination],
        origin = it[TripsTable.origin],
        startDate = it[TripsTable.startDate].toString(),
        endDate = it[TripsTable.endDate].toString()
    )
}