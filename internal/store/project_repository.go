package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lalognaviz/guion-studio/internal/domain"
)

// ListarProyectos devuelve todos los proyectos ordenados por última edición.
func (r *ProjectRepository) ListarProyectos() ([]domain.ProyectoResumen, error) {
	rows, err := r.sql.Query(`
		SELECT id, titulo, ruta_archivo, sinopsis, creado_en
		FROM proyectos
		ORDER BY actualizado_en DESC, creado_en DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []domain.ProyectoResumen{}
	for rows.Next() {
		var (
			p    domain.ProyectoResumen
			ruta sql.NullString
		)
		if err := rows.Scan(&p.ID, &p.Titulo, &ruta, &p.Sinopsis, &p.CreadoEn); err != nil {
			return nil, err
		}
		if ruta.Valid {
			p.RutaArchivo = &ruta.String
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// ObtenerProyecto reconstruye el grafo completo de un proyecto.
func (r *ProjectRepository) ObtenerProyecto(id string) (*domain.Proyecto, error) {
	var (
		p    domain.Proyecto
		ruta sql.NullString
	)
	err := r.sql.QueryRow(`
		SELECT id, titulo, sinopsis, ruta_archivo, creado_en, actualizado_en
		FROM proyectos WHERE id = ?`, id).
		Scan(&p.ID, &p.Titulo, &p.Sinopsis, &ruta, &p.CreadoEn, &p.ActualizadoEn)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("proyecto con id %q no encontrado", id)
	}
	if err != nil {
		return nil, err
	}
	if ruta.Valid {
		p.RutaArchivo = &ruta.String
	}

	p.Actos = []domain.Acto{}
	p.Escenas = []domain.Escena{}

	actRows, err := r.sql.Query(`
		SELECT id, orden, nombre, sinopsis, plot_point
		FROM actos WHERE proyecto_id = ? ORDER BY orden ASC`, id)
	if err != nil {
		return nil, err
	}
	for actRows.Next() {
		var a domain.Acto
		if err := actRows.Scan(&a.ID, &a.Orden, &a.Nombre, &a.Sinopsis, &a.PlotPoint); err != nil {
			actRows.Close()
			return nil, err
		}
		p.Actos = append(p.Actos, a)
	}
	if err := actRows.Err(); err != nil {
		actRows.Close()
		return nil, err
	}
	actRows.Close()

	sceneRows, err := r.sql.Query(`
		SELECT id, acto_id, orden, titulo, estado, descripcion, escaleta,
		       diseno_nivel, sonido, texto_juego, dialogos
		FROM escenas WHERE proyecto_id = ? ORDER BY acto_id ASC, orden ASC`, id)
	if err != nil {
		return nil, err
	}
	for sceneRows.Next() {
		var s domain.Escena
		if err := sceneRows.Scan(&s.ID, &s.ActoID, &s.Orden, &s.Titulo, &s.Estado,
			&s.Descripcion, &s.Escaleta, &s.DisenoNivel, &s.Sonido, &s.TextoJuego, &s.Dialogos); err != nil {
			sceneRows.Close()
			return nil, err
		}
		p.Escenas = append(p.Escenas, s)
	}
	if err := sceneRows.Err(); err != nil {
		sceneRows.Close()
		return nil, err
	}
	sceneRows.Close()

	connRows, err := r.sql.Query(`
		SELECT id, escena_origen_id, escena_destino_id, etiqueta
		FROM conexiones WHERE proyecto_id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer connRows.Close()

	byOrigin := map[string][]domain.Conexion{}
	for connRows.Next() {
		var (
			c      domain.Conexion
			origin string
		)
		if err := connRows.Scan(&c.ID, &origin, &c.TargetSceneID, &c.Label); err != nil {
			return nil, err
		}
		byOrigin[origin] = append(byOrigin[origin], c)
	}
	if err := connRows.Err(); err != nil {
		return nil, err
	}
	for i := range p.Escenas {
		if cs, ok := byOrigin[p.Escenas[i].ID]; ok {
			p.Escenas[i].Conexiones = cs
		}
	}
	return &p, nil
}

// GuardarProyecto hace upsert del agregado completo dentro de una transacción.
func (r *ProjectRepository) GuardarProyecto(p domain.Proyecto) error {
	if p.ID == "" {
		return errors.New("el proyecto requiere un id")
	}
	now := time.Now().Format("2006-01-02 15:04:05")
	if p.CreadoEn == "" {
		p.CreadoEn = now
	}
	if p.ActualizadoEn == "" {
		p.ActualizadoEn = now
	}

	tx, err := r.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
		INSERT INTO proyectos (id, titulo, sinopsis, ruta_archivo, creado_en, actualizado_en)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			titulo = excluded.titulo,
			sinopsis = excluded.sinopsis,
			ruta_archivo = excluded.ruta_archivo,
			actualizado_en = excluded.actualizado_en`,
		p.ID, p.Titulo, p.Sinopsis, p.RutaArchivo, p.CreadoEn, p.ActualizadoEn); err != nil {
		return err
	}

	if _, err := tx.Exec(`DELETE FROM conexiones WHERE proyecto_id = ?`, p.ID); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM escenas WHERE proyecto_id = ?`, p.ID); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM actos WHERE proyecto_id = ?`, p.ID); err != nil {
		return err
	}

	for _, a := range p.Actos {
		if _, err := tx.Exec(`
			INSERT INTO actos (id, proyecto_id, orden, nombre, sinopsis, plot_point)
			VALUES (?, ?, ?, ?, ?, ?)`,
			a.ID, p.ID, a.Orden, a.Nombre, a.Sinopsis, a.PlotPoint); err != nil {
			return err
		}
	}

	for _, s := range p.Escenas {
		if _, err := tx.Exec(`
			INSERT INTO escenas (id, proyecto_id, acto_id, orden, titulo, estado, descripcion,
				escaleta, diseno_nivel, sonido, texto_juego, dialogos)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			s.ID, p.ID, s.ActoID, s.Orden, s.Titulo, s.Estado, s.Descripcion,
			s.Escaleta, s.DisenoNivel, s.Sonido, s.TextoJuego, s.Dialogos); err != nil {
			return err
		}
		for _, c := range s.Conexiones {
			if _, err := tx.Exec(`
				INSERT INTO conexiones (id, proyecto_id, escena_origen_id, escena_destino_id, etiqueta)
				VALUES (?, ?, ?, ?, ?)`,
				c.ID, p.ID, s.ID, c.TargetSceneID, c.Label); err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

// EliminarProyecto borra el proyecto y todo su grafo en cascada.
func (r *ProjectRepository) EliminarProyecto(id string) error {
	_, err := r.sql.Exec(`DELETE FROM proyectos WHERE id = ?`, id)
	return err
}
