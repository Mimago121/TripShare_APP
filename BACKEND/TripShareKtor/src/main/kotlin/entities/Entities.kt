package entities

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import tables.*


class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(Users)
    var email by Users.email
    var userName by Users.userName
    var avatarUrl by Users.avatarUrl
    var bio by Users.bio
    var provider by Users.provider
    var createdAt by Users.createdAt
    var passwordHash by Users.passwordHash
    var role by Users.role
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
    var imageUrl by Trips.imageUrl
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

class VisitedPlaceEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<VisitedPlaceEntity>(VisitedPlaces)
    var userId by VisitedPlaces.userId
    var name by VisitedPlaces.name
    var latitude by VisitedPlaces.latitude
    var longitude by VisitedPlaces.longitude
}