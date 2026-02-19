package com.tripshare.repository

import data.ExpenseEntity
import data.Expenses
import database.DatabaseFactory.dbQuery
import domain.ExpenseModel
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.transactions.transaction

class ExpenseRepository {
    suspend fun getExpensesByTrip(tripId: Long): List<ExpenseModel> = dbQuery {
        ExpenseEntity.find { Expenses.tripId eq tripId }.map { entity ->
            ExpenseModel(
                id = entity.id.value,
                tripId = entity.tripId.value,
                paidByUserId = entity.paidBy.value,
                description = entity.description,
                amount = entity.amount.toDouble(),
                createdAt = entity.createdAt.toString()
            )
        }
    }

    fun addExpense(tripId: Long, paidByUserId: Long, description: String, amount: Double): Long? {
        return transaction {
            Expenses.insertAndGetId {
                it[this.tripId] = tripId
                it[this.paidBy] = paidByUserId
                it[this.description] = description
                it[this.amount] = java.math.BigDecimal.valueOf(amount)
            }.value
        }
    }


}