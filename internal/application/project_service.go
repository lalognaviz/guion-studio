package application

import (
	"errors"

	"github.com/lalognaviz/guion-studio/internal/domain"
	"github.com/lalognaviz/guion-studio/internal/store"
)

// ProjectService orquesta las operaciones sobre proyectos.
type ProjectService struct {
	repo *store.ProjectRepository
}

// NewProjectService construye el servicio con su repositorio.
func NewProjectService(repo *store.ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

// ListarProyectos devuelve el listado para el Dashboard.
func (s *ProjectService) ListarProyectos() ([]domain.ProyectoResumen, error) {
	return s.repo.ListarProyectos()
}

// ObtenerProyecto reconstruye el grafo completo de un proyecto.
func (s *ProjectService) ObtenerProyecto(id string) (*domain.Proyecto, error) {
	if id == "" {
		return nil, errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.ObtenerProyecto(id)
}

// GuardarProyecto valida y persiste el agregado completo.
func (s *ProjectService) GuardarProyecto(p domain.Proyecto) error {
	if p.ID == "" {
		return errors.New("el proyecto requiere un id")
	}
	if p.Titulo == "" {
		return errors.New("el proyecto requiere un título")
	}
	return s.repo.GuardarProyecto(p)
}

// EliminarProyecto borra un proyecto y todo su grafo.
func (s *ProjectService) EliminarProyecto(id string) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.EliminarProyecto(id)
}

// ActualizarTituloProyecto actualiza solo el título.
func (s *ProjectService) ActualizarTituloProyecto(id, titulo string) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.UpdateProjectTitle(id, titulo)
}

// ActualizarSinopsisProyecto actualiza solo la sinopsis.
func (s *ProjectService) ActualizarSinopsisProyecto(id, sinopsis string) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.UpdateProjectSynopsis(id, sinopsis)
}

// ActualizarActosProyecto actualiza los actos.
func (s *ProjectService) ActualizarActosProyecto(id string, actos []domain.Acto) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.UpdateProjectActs(id, actos)
}

// ActualizarEscenasProyecto actualiza las escenas y sus relaciones.
func (s *ProjectService) ActualizarEscenasProyecto(id string, escenas []domain.Escena) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.UpdateProjectScenes(id, escenas)
}

// ActualizarEntidadesAuxiliares actualiza las entidades auxiliares.
func (s *ProjectService) ActualizarEntidadesAuxiliares(id string, pers []domain.Personaje, ubi []domain.Ubicacion, vars []domain.Variable, tl []domain.EventoTimeline) error {
	if id == "" {
		return errors.New("el id del proyecto es obligatorio")
	}
	return s.repo.UpdateProjectEntidadesAux(id, pers, ubi, vars, tl)
}
