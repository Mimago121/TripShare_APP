import io.ktor.server.application.*
import plugins.configureCors
import plugins.configureRouting
import plugins.configureSerialization
import database.DatabaseFactory // Asegúrate de importar tu factory

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    // 1. INICIALIZA LA BASE DE DATOS PRIMERO
    DatabaseFactory.init(environment.config)

    // 2. LUEGO LOS PLUGINS
    configureCors()
    configureSerialization()
    configureRouting()
}