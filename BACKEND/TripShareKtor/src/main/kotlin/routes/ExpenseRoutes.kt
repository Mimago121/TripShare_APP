package routes

import tables.*
import dto.*
import repository.ExpenseRepository
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.expenseRouting(expenseRepo: ExpenseRepository) {

    // Rutas asociadas a un viaje concreto
    route("/trips/{id}/expenses") {
        get {
            val id = call.parameters["id"]?.toLongOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
            try {
                val expensesList = transaction {
                    (Expenses innerJoin Users)
                        .slice(Expenses.id, Expenses.description, Expenses.amount, Expenses.paidBy, Users.userName)
                        .select { Expenses.tripId eq id }
                        .map { row ->
                            val expenseId = row[Expenses.id].value
                            val splitsList = (ExpenseSplits innerJoin Users)
                                .slice(Users.id, Users.userName, ExpenseSplits.shareAmount, ExpenseSplits.isPaid)
                                .select { ExpenseSplits.expenseId eq expenseId }
                                .map { splitRow ->
                                    SplitDto(
                                        userId = splitRow[Users.id].value,
                                        userName = splitRow[Users.userName],
                                        amount = splitRow[ExpenseSplits.shareAmount].toDouble(),
                                        isPaid = splitRow[ExpenseSplits.isPaid]
                                    )
                                }
                            ExpenseResponse(
                                id = expenseId,
                                description = row[Expenses.description],
                                amount = row[Expenses.amount].toDouble(),
                                paidByUserName = row[Users.userName],
                                paidById = row[Expenses.paidBy].value,
                                splits = splitsList
                            )
                        }
                }
                call.respond(expensesList)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, "Error: ${e.message}")
            }
        }

        authenticate("auth-session") {
            post {
                val tripIdParam = call.parameters["id"]?.toLongOrNull() ?: return@post call.respond(HttpStatusCode.BadRequest)
                try {
                    val params = call.receive<CreateExpenseRequest>()
                    val newExpenseId = expenseRepo.addExpense(tripIdParam, params.paidByUserId, params.description, params.amount)

                    if (newExpenseId != null) {
                        transaction {
                            val memberIds = TripMembers
                                .slice(TripMembers.userId)
                                .select { TripMembers.tripId eq tripIdParam }
                                .map { it[TripMembers.userId] }

                            val totalMembers = memberIds.size
                            if (totalMembers > 0) {
                                val shareDouble = params.amount / totalMembers
                                val share = java.math.BigDecimal.valueOf(shareDouble)

                                memberIds.forEach { memberId ->
                                    if (memberId.value != params.paidByUserId) {
                                        ExpenseSplits.insert {
                                            it[expenseId] = newExpenseId
                                            it[userId] = memberId
                                            it[shareAmount] = share
                                            it[isPaid] = false
                                        }
                                    }
                                }
                            }
                        }
                        call.respond(HttpStatusCode.Created, mapOf("status" to "Gasto creado"))
                    } else {
                        call.respond(HttpStatusCode.BadRequest, "Error BD")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError)
                }
            }
        }
    }

    // Ruta global para pagar gastos
    authenticate("auth-session") {
        put("/trips/expenses/pay") {
            try {
                val params = call.receive<Map<String, String>>()
                val expenseId = params["expenseId"]?.toLongOrNull()
                val userId = params["userId"]?.toLongOrNull()

                if (expenseId != null && userId != null) {
                    transaction {
                        ExpenseSplits.update({ (ExpenseSplits.expenseId eq expenseId) and (ExpenseSplits.userId eq userId) }) {
                            it[isPaid] = true
                        }
                    }
                    call.respond(HttpStatusCode.OK)
                } else call.respond(HttpStatusCode.BadRequest)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError)
            }
        }
    }
}