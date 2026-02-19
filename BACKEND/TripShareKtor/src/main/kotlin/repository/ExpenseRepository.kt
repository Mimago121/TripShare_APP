package repository

import tables.* // Importamos el esquema de la BD (Tablas)
import entities.* // Importamos el DAO
import database.DatabaseFactory.dbQuery
import dto.ExpenseModel
import org.jetbrains.exposed.sql.insertAndGetId


class ExpenseRepository {

    // ==========================================
    // 1. OBTENER GASTOS
    // ==========================================


    // Recupera el historial completo de gastos de un viaje específico.

    suspend fun getExpensesByTrip(tripId: Long): List<ExpenseModel> = dbQuery {
        ExpenseEntity.find { Expenses.tripId eq tripId }.map { entity ->
            ExpenseModel(
                id = entity.id.value,
                tripId = entity.tripId.value,
                paidByUserId = entity.paidBy.value,
                description = entity.description,
                amount = entity.amount.toDouble(), // Convertimos BigDecimal a Double para el JSON
                createdAt = entity.createdAt.toString()
            )
        }
    }

    // ==========================================
    // 2. REGISTRAR UN GASTO
    // ==========================================


    // Registra un nuevo gasto pagado por un usuario en un viaje.

    suspend fun addExpense(tripId: Long, paidByUserId: Long, description: String, amount: Double): Long? = dbQuery {
        val newExpenseId = Expenses.insertAndGetId {
            it[this.tripId] = tripId
            it[this.paidBy] = paidByUserId
            it[this.description] = description

            // CONVERSIÓN CRÍTICA: Convertimos el Double a BigDecimal para
            // guardarlo en la columna DECIMAL(10,2) de forma segura y precisa.
            it[this.amount] = java.math.BigDecimal.valueOf(amount)
        }

        newExpenseId.value // Devolvemos el ID Long puro
    }
}