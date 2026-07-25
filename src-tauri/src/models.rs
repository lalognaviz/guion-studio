use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProyectoResumen {
    pub id: i32,
    pub titulo: String,
    pub ruta_archivo: Option<String>,
    pub creado_en: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ActoResumen {
    pub id: i32,
    pub titulo: String,
    pub orden: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProyectoDetalle {
    pub id: i32,
    pub titulo: String,
    pub ruta_archivo: Option<String>,
    pub sinopsis: String,
    pub actos: Vec<ActoResumen>,
}
