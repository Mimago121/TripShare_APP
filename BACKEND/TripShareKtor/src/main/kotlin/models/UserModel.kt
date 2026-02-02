package com.tuproyecto.models

import kotlinx.serialization.Serializable

@Serializable
data class UserModel(
    val id: Long,
    val email: String,
    val name: String,
    val avatarUrl: String? = null
)