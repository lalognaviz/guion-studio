package main

import (
	"context"
	"errors"

	"github.com/lalognaviz/guion-studio/internal/application"
	"github.com/lalognaviz/guion-studio/internal/domain"
	"github.com/lalognaviz/guion-studio/internal/store"
)

// App es la fachada Wails: sólo delega en la capa de aplicación.
type App struct {
	ctx      context.Context
	repo     *store.ProjectRepository
	projects *application.ProjectService
	scenes   *application.SceneService
	dbErr    error
}

// NewApp crea la instancia de la aplicación.
func NewApp() *App {
	return &App{}
}

// startup se ejecuta al arrancar: abre SQLite y construye los servicios.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	repo, err := store.Open(store.DefaultPath())
	if err != nil {
		a.dbErr = err
		return
	}
	a.repo = repo
	a.projects = application.NewProjectService(repo)
	a.scenes = application.NewSceneService(repo)
}

func (a *App) services() (*application.ProjectService, *application.SceneService, error) {
	if a.projects != nil && a.scenes != nil {
		return a.projects, a.scenes, nil
	}
	if a.dbErr != nil {
		return nil, nil, a.dbErr
	}
	return nil, nil, errors.New("base de datos no inicializada")
}

// ListarProyectos lista los proyectos ordenados por última edición.
func (a *App) ListarProyectos() ([]domain.ProyectoResumen, error) {
	projects, _, err := a.services()
	if err != nil {
		return nil, err
	}
	return projects.ListarProyectos()
}

// ObtenerProyecto devuelve el grafo completo de un proyecto.
func (a *App) ObtenerProyecto(id string) (*domain.Proyecto, error) {
	projects, _, err := a.services()
	if err != nil {
		return nil, err
	}
	return projects.ObtenerProyecto(id)
}

// GuardarProyecto persiste el proyecto con sus actos, escenas y conexiones.
func (a *App) GuardarProyecto(p domain.Proyecto) error {
	projects, _, err := a.services()
	if err != nil {
		return err
	}
	return projects.GuardarProyecto(p)
}

// EliminarProyecto borra un proyecto y todo su grafo.
func (a *App) EliminarProyecto(id string) error {
	projects, _, err := a.services()
	if err != nil {
		return err
	}
	return projects.EliminarProyecto(id)
}

// CrearEscena añade una escena a un acto.
func (a *App) CrearEscena(proyectoID, actoID, titulo string) (*domain.Escena, error) {
	_, scenes, err := a.services()
	if err != nil {
		return nil, err
	}
	return scenes.CrearEscena(proyectoID, actoID, titulo)
}

// ActualizarEscena reemplaza una escena existente.
func (a *App) ActualizarEscena(proyectoID string, escena domain.Escena) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.ActualizarEscena(proyectoID, escena)
}

// EliminarEscena borra una escena y las conexiones que apuntaban a ella.
func (a *App) EliminarEscena(proyectoID, escenaID string) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.EliminarEscena(proyectoID, escenaID)
}

// MoverEscena mueve una escena a otro acto en la posición indicada.
func (a *App) MoverEscena(proyectoID, escenaID, actoDestinoID string, posicion int) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.MoverEscena(proyectoID, escenaID, actoDestinoID, posicion)
}

// ReordenarEscena reordena una escena dentro de su acto.
func (a *App) ReordenarEscena(proyectoID, escenaID string, posicion int) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.ReordenarEscena(proyectoID, escenaID, posicion)
}

// ConectarEscenas crea una conexión dirigida entre dos escenas.
func (a *App) ConectarEscenas(proyectoID, origenID, destinoID, etiqueta string) (*domain.Conexion, error) {
	_, scenes, err := a.services()
	if err != nil {
		return nil, err
	}
	return scenes.ConectarEscenas(proyectoID, origenID, destinoID, etiqueta)
}

// DesconectarEscenas elimina una conexión por su id.
func (a *App) DesconectarEscenas(proyectoID, conexionID string) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.DesconectarEscenas(proyectoID, conexionID)
}

// CambiarEstadoEscena actualiza el estado narrativo de una escena.
func (a *App) CambiarEstadoEscena(proyectoID, escenaID, estado string) error {
	_, scenes, err := a.services()
	if err != nil {
		return err
	}
	return scenes.CambiarEstadoEscena(proyectoID, escenaID, estado)
}
