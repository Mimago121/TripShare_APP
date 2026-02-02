package database

// AGREGA ESTOS IMPORTS PARA QUE RECONOZCA LAS TABLAS
import database.Users
import database.Trips
import database.TripMembers
import database.Activities
import database.Expenses
import database.ExpenseSplits
import database.Memories
import database.TripInvites

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init() {
        val database = Database.connect(createHikariDataSource())

        transaction(database) {
            // Esto creará las tablas en MySQL automáticamente si no existen
            SchemaUtils.create(
                Users, Trips, TripMembers, Activities,
                Expenses, ExpenseSplits, Memories, TripInvites
            )
        }
    }

    private fun createHikariDataSource(): HikariDataSource {
        val config = HikariConfig().apply {
            driverClassName = "com.mysql.cj.jdbc.Driver"
            jdbcUrl = "jdbc:mysql://localhost:3306/trip_share_db?allowPublicKeyRetrieval=true&useSSL=false"
            username = "johan"
            password = "johan"
            maximumPoolSize = 3
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        return HikariDataSource(config)
    }

    suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}