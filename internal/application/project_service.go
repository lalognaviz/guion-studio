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
