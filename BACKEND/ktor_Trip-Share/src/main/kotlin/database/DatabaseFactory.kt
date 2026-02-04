package database

import org.jetbrains.exposed.sql.Database
import io.ktor.server.config.*

object DatabaseFactory {
    fun init(config: ApplicationConfig) {
        val driverClassName = config.property("storage.driverClassName").getString()
        val jdbcUrl = config.property("storage.jdbcUrl").getString()
        val user = config.property("storage.user").getString()
        val password = config.property("storage.password").getString()

        Database.connect(jdbcUrl, driverClassName, user, password)
    }
}