package store

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type ProyectoResumen struct {
	ID          int     `json:"id"`
	Titulo      string  `json:"titulo"`
	RutaArchivo *string `json:"ruta_archivo"`
	CreadoEn    string  `json:"creado_en"`
}

type ActoResumen struct {
	ID     int    `json:"id"`
	Titulo string `json:"titulo"`
	Orden  int    `json:"orden"`
}

type ProyectoDetalle struct {
	ID          int            `json:"id"`
	Titulo      string         `json:"titulo"`
	RutaArchivo *string        `json:"ruta_archivo"`
	Sinopsis    string         `json:"sinopsis"`
	Actos       []ActoResumen  `json:"actos"`
}

type DB struct {
	sql *sql.DB
}

// DefaultPath devuelve la ruta de guiones.db en el directorio de configuración
// del usuario (una aplicación por usuario, datos locales).
func DefaultPath() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "guiones.db"
	}
	dir = filepath.Join(dir, "guion-studio")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return filepath.Join("guiones.db")
	}
	return filepath.Join(dir, "guiones.db")
}

// Abre (y crea si no existe) la base de datos, aplicando el esquema y el seed inicial.
func Open(path string) (*DB, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	if err := initSchema(db); err != nil {
		db.Close()
		return nil, err
	}
	return &DB{sql: db}, nil
}

func initSchema(db *sql.DB) error {
	_, err := db.Exec(`
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
	`)
	if err != nil {
		return err
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM proyectos`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	seeds := []struct {
		id       int
		titulo   string
		ruta     string
		sinopsis string
	}{
		{1, "CyberNights", "/proyectos/cybernights.json", "Un thriller cyberpunk sobre conspiraciones corporativas."},
		{2, "Shadow Realm", "/proyectos/shadow.json", "Fantasía oscura y supervivencia en el reino de las sombras."},
	}
	for _, s := range seeds {
		if _, err := tx.Exec(
			`INSERT INTO proyectos (id, titulo, ruta_archivo, sinopsis, creado_en) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			s.id, s.titulo, s.ruta, s.sinopsis,
		); err != nil {
			return err
		}
	}

	actos := []struct {
		id         int
		proyectoID int
		titulo     string
		orden      int
	}{
		{1, 1, "Planteamiento", 1},
		{2, 1, "Confrontación", 2},
		{3, 1, "Resolución", 3},
		{4, 2, "El Despertar", 1},
		{5, 2, "La Caída", 2},
		{6, 2, "El Eclipse", 3},
	}
	for _, a := range actos {
		if _, err := tx.Exec(
			`INSERT INTO actos (id, proyecto_id, titulo, orden) VALUES (?, ?, ?, ?)`,
			a.id, a.proyectoID, a.titulo, a.orden,
		); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ProyectosRecientes lista todos los proyectos ordenados por fecha de creación.
func (d *DB) ProyectosRecientes() ([]ProyectoResumen, error) {
	rows, err := d.sql.Query(`SELECT id, titulo, ruta_archivo, creado_en FROM proyectos ORDER BY creado_en DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []ProyectoResumen{}
	for rows.Next() {
		var p ProyectoResumen
		var ruta sql.NullString
		if err := rows.Scan(&p.ID, &p.Titulo, &ruta, &p.CreadoEn); err != nil {
			return nil, err
		}
		if ruta.Valid {
			p.RutaArchivo = &ruta.String
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// DetallesProyecto devuelve un proyecto con sus actos ordenados.
func (d *DB) DetallesProyecto(id int) (*ProyectoDetalle, error) {
	var p ProyectoDetalle
	var ruta sql.NullString
	err := d.sql.QueryRow(`SELECT id, titulo, ruta_archivo, sinopsis FROM proyectos WHERE id = ?`, id).
		Scan(&p.ID, &p.Titulo, &ruta, &p.Sinopsis)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("Proyecto con ID %d no encontrado", id)
	}
	if err != nil {
		return nil, err
	}
	if ruta.Valid {
		p.RutaArchivo = &ruta.String
	}

	rows, err := d.sql.Query(`SELECT id, titulo, orden FROM actos WHERE proyecto_id = ? ORDER BY orden ASC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	p.Actos = []ActoResumen{}
	for rows.Next() {
		var a ActoResumen
		if err := rows.Scan(&a.ID, &a.Titulo, &a.Orden); err != nil {
			return nil, err
		}
		p.Actos = append(p.Actos, a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return &p, nil
}

func (d *DB) Close() error {
	return d.sql.Close()
}
