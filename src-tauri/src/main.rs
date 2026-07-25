#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod models;

use models::{ActoResumen, ProyectoDetalle, ProyectoResumen};
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};


fn get_db_connection(app_handle: Option<&tauri::AppHandle>) -> Result<rusqlite::Connection, String> {
    let db_path = if let Some(app) = app_handle {
        if let Ok(mut dir) = app.path().app_data_dir() {
            let _ = std::fs::create_dir_all(&dir);
            dir.push("guiones.db");
            dir
        } else {
            std::path::PathBuf::from("guiones.db")
        }
    } else {
        std::path::PathBuf::from("guiones.db")
    };

    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    init_db(&conn)?;
    Ok(conn)
}

pub fn init_db(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS proyectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            ruta_archivo TEXT,
            sinopsis TEXT DEFAULT '',
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS actos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proyecto_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            orden INTEGER NOT NULL,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
        );
        "#,
    )
    .map_err(|e| e.to_string())?;

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM proyectos", [], |row| row.get(0))
        .unwrap_or(0);

    if count == 0 {
        conn.execute(
            "INSERT INTO proyectos (id, titulo, ruta_archivo, sinopsis, creado_en) VALUES (1, 'CyberNights', '/proyectos/cybernights.json', 'Un thriller cyberpunk sobre conspiraciones corporativas.', CURRENT_TIMESTAMP)",
            [],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO proyectos (id, titulo, ruta_archivo, sinopsis, creado_en) VALUES (2, 'Shadow Realm', '/proyectos/shadow.json', 'Fantasía oscura y supervivencia en el reino de las sombras.', CURRENT_TIMESTAMP)",
            [],
        ).map_err(|e| e.to_string())?;

        conn.execute_batch(
            r#"
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (1, 1, 'Planteamiento', 1);
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (2, 1, 'Confrontación', 2);
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (3, 1, 'Resolución', 3);
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (4, 2, 'El Despertar', 1);
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (5, 2, 'La Caída', 2);
            INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (6, 2, 'El Eclipse', 3);
            "#,
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn obtener_proyectos_recientes_db(conn: &rusqlite::Connection) -> Result<Vec<ProyectoResumen>, String> {
    let mut stmt = conn
        .prepare("SELECT id, titulo, ruta_archivo, creado_en FROM proyectos ORDER BY creado_en DESC")
        .map_err(|e| e.to_string())?;

    let proyectos_iter = stmt
        .query_map([], |row| {
            Ok(ProyectoResumen {
                id: row.get(0)?,
                titulo: row.get(1)?,
                ruta_archivo: row.get(2)?,
                creado_en: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut proyectos = Vec::new();
    for p in proyectos_iter {
        proyectos.push(p.map_err(|e| e.to_string())?);
    }
    Ok(proyectos)
}

pub fn obtener_detalles_proyecto_db(
    conn: &rusqlite::Connection,
    proyecto_id: i32,
) -> Result<ProyectoDetalle, String> {
    let mut stmt_p = conn
        .prepare("SELECT id, titulo, ruta_archivo, sinopsis FROM proyectos WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut rows_p = stmt_p
        .query(rusqlite::params![proyecto_id])
        .map_err(|e| e.to_string())?;

    let row_p = match rows_p.next().map_err(|e| e.to_string())? {
        Some(row) => row,
        None => return Err(format!("Proyecto con ID {} no encontrado", proyecto_id)),
    };

    let id: i32 = row_p.get(0).map_err(|e| e.to_string())?;
    let titulo: String = row_p.get(1).map_err(|e| e.to_string())?;
    let ruta_archivo: Option<String> = row_p.get(2).map_err(|e| e.to_string())?;
    let sinopsis: String = row_p.get(3).map_err(|e| e.to_string())?;

    let mut stmt_a = conn
        .prepare("SELECT id, titulo, orden FROM actos WHERE proyecto_id = ?1 ORDER BY orden ASC")
        .map_err(|e| e.to_string())?;

    let actos_iter = stmt_a
        .query_map(rusqlite::params![proyecto_id], |row| {
            Ok(ActoResumen {
                id: row.get(0)?,
                titulo: row.get(1)?,
                orden: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut actos = Vec::new();
    for a in actos_iter {
        actos.push(a.map_err(|e| e.to_string())?);
    }

    Ok(ProyectoDetalle {
        id,
        titulo,
        ruta_archivo,
        sinopsis,
        actos,
    })
}

#[tauri::command]
async fn export_project_to_md(project_id: String) -> Result<String, String> {
    Ok(format!(
        "Proyecto {} exportado a Markdown exitosamente (Simulado).",
        project_id
    ))
}

#[tauri::command]
fn obtener_proyectos_recientes(
    app_handle: tauri::AppHandle,
) -> Result<Vec<ProyectoResumen>, String> {
    let conn = get_db_connection(Some(&app_handle))?;
    obtener_proyectos_recientes_db(&conn)
}

#[tauri::command]
fn obtener_detalles_proyecto(
    app_handle: tauri::AppHandle,
    proyecto_id: i32,
) -> Result<ProyectoDetalle, String> {
    let conn = get_db_connection(Some(&app_handle))?;
    obtener_detalles_proyecto_db(&conn, proyecto_id)
}

fn main() {
    let migrations = vec![Migration {
        version: 1,
        description: "Crear_Esquema_Inicial_GuionStudio",
        sql: r#"
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS proyectos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                ruta_archivo TEXT,
                sinopsis TEXT DEFAULT '',
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS actos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proyecto_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                orden INTEGER NOT NULL,
                FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                titulo TEXT NOT NULL,
                logline TEXT,
                tema TEXT DEFAULT 'light',
                llm_api_key TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS acts (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                orden INTEGER NOT NULL CHECK(orden IN (1, 2, 3)),
                nombre TEXT NOT NULL,
                resumen TEXT,
                plot_point TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS scenes (
                id TEXT PRIMARY KEY,
                act_id TEXT NOT NULL,
                orden INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                estado TEXT DEFAULT 'Borrador',
                escaleta TEXT,
                diseno_nivel TEXT,
                sonido TEXT,
                texto_juego TEXT,
                dialogos TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (act_id) REFERENCES acts(id) ON DELETE CASCADE
            );
        "#,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:guiones.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            export_project_to_md,
            obtener_proyectos_recientes,
            obtener_detalles_proyecto
        ])
        .run(tauri::generate_context!())
        .expect("Ocurrió un error al ejecutar la aplicación Tauri");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_project_to_md() {
        let project_id = "proj-123".to_string();
        let result = tauri::async_runtime::block_on(export_project_to_md(project_id.clone()));
        assert!(result.is_ok());
        let md = result.unwrap();
        assert!(md.contains("proj-123"));
        assert!(md.contains("exportado a Markdown exitosamente"));
    }

    #[test]
    fn test_obtener_proyectos_y_detalles() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        init_db(&conn).unwrap();

        let recientes = obtener_proyectos_recientes_db(&conn).unwrap();
        assert_eq!(recientes.len(), 2);
        assert_eq!(recientes[0].titulo, "CyberNights");

        let detalle = obtener_detalles_proyecto_db(&conn, 1).unwrap();
        assert_eq!(detalle.id, 1);
        assert_eq!(detalle.titulo, "CyberNights");
        assert_eq!(detalle.actos.len(), 3);
        assert_eq!(detalle.actos[0].titulo, "Planteamiento");

        let detalle_error = obtener_detalles_proyecto_db(&conn, 999);
        assert!(detalle_error.is_err());
    }
}
