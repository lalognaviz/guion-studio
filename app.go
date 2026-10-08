package main

import (
	"context"
	"errors"

	"github.com/lalognaviz/guion-studio/internal/store"
)

// App estructura del backend vinculada a JavaScript vía Wails bindings.
type App struct {
	ctx    context.Context
	db     *store.DB
	dbErr  error
}

// NewApp crea la instancia de la aplicación.
func NewApp() *App {
	return &App{}
}

// startup se ejecuta al arrancar: abre SQLite (esquema + seed).
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	db, err := store.Open(store.DefaultPath())
	if err != nil {
		a.dbErr = err
		return
	}
	a.db = db
}

func (a *App) dbOrErr() (*store.DB, error) {
	if a.db != nil {
		return a.db, nil
	}
	if a.dbErr != nil {
		return nil, a.dbErr
	}
	return nil, errors.New("base de datos no inicializada")
}

// ObtenerProyectosRecientes lista los proyectos (contrato IPC consumido por api/client.ts).
func (a *App) ObtenerProyectosRecientes() ([]store.ProyectoResumen, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return nil, err
	}
	return db.ProyectosRecientes()
}

// ObtenerDetallesProyecto devuelve un proyecto con sus actos.
func (a *App) ObtenerDetallesProyecto(proyectoId int) (*store.ProyectoDetalle, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return nil, err
	}
	return db.DetallesProyecto(proyectoId)
}
