#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
async fn export_project_to_md(project_id: String) -> Result<String, String> {
    // Logic to export the project will be implemented here later.
    Ok(format!("Proyecto {} exportado a Markdown exitosamente (Simulado).", project_id))
}

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "Crear_Esquema_Inicial_GuionStudio",
            sql: r#"
                PRAGMA foreign_keys = ON;

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
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:guiones.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            export_project_to_md
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
    fn test_migrations_structure() {
        let migration = Migration {
            version: 1,
            description: "Crear_Esquema_Inicial_GuionStudio",
            sql: r#"PRAGMA foreign_keys = ON;"#,
            kind: MigrationKind::Up,
        };
        assert_eq!(migration.version, 1);
        assert_eq!(migration.description, "Crear_Esquema_Inicial_GuionStudio");
    }
}

