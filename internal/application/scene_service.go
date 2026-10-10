package application

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"

	"github.com/lalognaviz/guion-studio/internal/domain"
	"github.com/lalognaviz/guion-studio/internal/store"
)

// estadosValidos son los estados admitidos por el modelo de escena.
var estadosValidos = map[string]bool{"Borrador": true, "Revisado": true, "Final": true}

// SceneService concentra las operaciones a nivel de escena dentro de un
// proyecto. Toda la consistencia del agregado se resuelve aquí, no en la UI.
type SceneService struct {
	repo *store.ProjectRepository
}

// NewSceneService construye el servicio con su repositorio.
func NewSceneService(repo *store.ProjectRepository) *SceneService {
	return &SceneService{repo: repo}
}

// CrearEscena añade una escena al final de un acto y persiste el proyecto.
func (s *SceneService) CrearEscena(proyectoID, actoID, titulo string) (*domain.Escena, error) {
	if proyectoID == "" {
		return nil, errors.New("el id del proyecto es obligatorio")
	}
	if actoID == "" {
		return nil, errors.New("el id del acto es obligatorio")
	}

	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return nil, err
	}
	if !tieneActo(proyecto, actoID) {
		return nil, fmt.Errorf("el acto %q no existe en el proyecto", actoID)
	}

	if titulo == "" {
		titulo = fmt.Sprintf("Nueva Escena %d", siguienteOrden(proyecto, actoID))
	}
	escena := domain.Escena{
		ID:     nuevoID("scn"),
		ActoID: actoID,
		Orden:  siguienteOrden(proyecto, actoID),
		Titulo: titulo,
		Estado: "Borrador",
	}
	proyecto.Escenas = append(proyecto.Escenas, escena)
	if err := s.repo.GuardarProyecto(*proyecto); err != nil {
		return nil, err
	}
	return &escena, nil
}

// ActualizarEscena reemplaza una escena existente por sus nuevos datos.
func (s *SceneService) ActualizarEscena(proyectoID string, escena domain.Escena) error {
	if escena.Estado != "" && !estadosValidos[escena.Estado] {
		return fmt.Errorf("estado de escena no válido: %q", escena.Estado)
	}
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}
	for i := range proyecto.Escenas {
		if proyecto.Escenas[i].ID == escena.ID {
			proyecto.Escenas[i] = escena
			return s.repo.GuardarProyecto(*proyecto)
		}
	}
	return fmt.Errorf("la escena %q no existe en el proyecto", escena.ID)
}

// EliminarEscena borra una escena y todas las conexiones que apuntaban a ella.
func (s *SceneService) EliminarEscena(proyectoID, escenaID string) error {
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}

	restantes := make([]domain.Escena, 0, len(proyecto.Escenas))
	encontrada := false
	for _, escena := range proyecto.Escenas {
		if escena.ID == escenaID {
			encontrada = true
			continue
		}
		escena.Conexiones = sinConexionesHacia(escena.Conexiones, escenaID)
		restantes = append(restantes, escena)
	}
	if !encontrada {
		return fmt.Errorf("la escena %q no existe en el proyecto", escenaID)
	}

	proyecto.Escenas = restantes
	return s.repo.GuardarProyecto(*proyecto)
}

// MoverEscena mueve una escena a otro acto (o dentro del mismo) en la posición
// indicada (1 = primera). Recalcula el orden de los actos afectados.
func (s *SceneService) MoverEscena(proyectoID, escenaID, actoDestinoID string, posicion int) error {
	if actoDestinoID == "" {
		return errors.New("el id del acto destino es obligatorio")
	}
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}
	if err := reubicarEscena(proyecto, escenaID, actoDestinoID, posicion); err != nil {
		return err
	}
	return s.repo.GuardarProyecto(*proyecto)
}

// ReordenarEscena mueve una escena a una posición dentro de su propio acto.
func (s *SceneService) ReordenarEscena(proyectoID, escenaID string, posicion int) error {
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}
	escena, err := buscarEscena(proyecto, escenaID)
	if err != nil {
		return err
	}
	if err := reubicarEscena(proyecto, escenaID, escena.ActoID, posicion); err != nil {
		return err
	}
	return s.repo.GuardarProyecto(*proyecto)
}

// ConectarEscenas crea una conexión dirigida entre dos escenas del proyecto.
// Rechaza la autorreferencia y las conexiones duplicadas.
func (s *SceneService) ConectarEscenas(proyectoID, origenID, destinoID, etiqueta string) (*domain.Conexion, error) {
	if origenID == "" || destinoID == "" {
		return nil, errors.New("origen y destino son obligatorios")
	}
	if origenID == destinoID {
		return nil, errors.New("una escena no puede conectarse consigo misma")
	}

	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return nil, err
	}
	origen, err := buscarEscena(proyecto, origenID)
	if err != nil {
		return nil, err
	}
	if _, err := buscarEscena(proyecto, destinoID); err != nil {
		return nil, err
	}
	for _, c := range origen.Conexiones {
		if c.TargetSceneID == destinoID {
			return nil, fmt.Errorf("la escena %q ya está conectada con %q", origenID, destinoID)
		}
	}

	conexion := domain.Conexion{ID: nuevoID("conn"), TargetSceneID: destinoID, Label: etiqueta}
	for i := range proyecto.Escenas {
		if proyecto.Escenas[i].ID == origenID {
			proyecto.Escenas[i].Conexiones = append(proyecto.Escenas[i].Conexiones, conexion)
			break
		}
	}
	if err := s.repo.GuardarProyecto(*proyecto); err != nil {
		return nil, err
	}
	return &conexion, nil
}

// DesconectarEscenas elimina una conexión por su id en cualquier escena origen.
func (s *SceneService) DesconectarEscenas(proyectoID, conexionID string) error {
	if conexionID == "" {
		return errors.New("el id de la conexión es obligatorio")
	}
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}

	encontrada := false
	for i := range proyecto.Escenas {
		filtradas := make([]domain.Conexion, 0, len(proyecto.Escenas[i].Conexiones))
		for _, c := range proyecto.Escenas[i].Conexiones {
			if c.ID == conexionID {
				encontrada = true
				continue
			}
			filtradas = append(filtradas, c)
		}
		if len(filtradas) == 0 {
			proyecto.Escenas[i].Conexiones = nil
		} else {
			proyecto.Escenas[i].Conexiones = filtradas
		}
	}
	if !encontrada {
		return fmt.Errorf("la conexión %q no existe en el proyecto", conexionID)
	}
	return s.repo.GuardarProyecto(*proyecto)
}

// CambiarEstadoEscena actualiza el estado narrativo de una escena.
func (s *SceneService) CambiarEstadoEscena(proyectoID, escenaID, estado string) error {
	if !estadosValidos[estado] {
		return fmt.Errorf("estado de escena no válido: %q", estado)
	}
	proyecto, err := s.repo.ObtenerProyecto(proyectoID)
	if err != nil {
		return err
	}
	for i := range proyecto.Escenas {
		if proyecto.Escenas[i].ID == escenaID {
			proyecto.Escenas[i].Estado = estado
			return s.repo.GuardarProyecto(*proyecto)
		}
	}
	return fmt.Errorf("la escena %q no existe en el proyecto", escenaID)
}

func buscarEscena(p *domain.Proyecto, escenaID string) (domain.Escena, error) {
	for _, e := range p.Escenas {
		if e.ID == escenaID {
			return e, nil
		}
	}
	return domain.Escena{}, fmt.Errorf("la escena %q no existe en el proyecto", escenaID)
}

// reubicarEscena mueve una escena dentro del agregado y renumera el orden de
// todos los actos para mantenerlo contiguo (1..N).
func reubicarEscena(p *domain.Proyecto, escenaID, actoDestinoID string, posicion int) error {
	if !tieneActo(p, actoDestinoID) {
		return fmt.Errorf("el acto %q no existe en el proyecto", actoDestinoID)
	}
	idx := -1
	for i := range p.Escenas {
		if p.Escenas[i].ID == escenaID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("la escena %q no existe en el proyecto", escenaID)
	}
	movida := p.Escenas[idx]
	movida.ActoID = actoDestinoID

	porActo := map[string][]domain.Escena{}
	for _, e := range p.Escenas {
		if e.ID == escenaID {
			continue
		}
		porActo[e.ActoID] = append(porActo[e.ActoID], e)
	}
	for actoID := range porActo {
		ordenarPorOrden(porActo[actoID])
	}

	destino := porActo[actoDestinoID]
	if posicion < 1 {
		posicion = 1
	}
	if posicion > len(destino)+1 {
		posicion = len(destino) + 1
	}
	destino = append(destino, domain.Escena{})
	copy(destino[posicion:], destino[posicion-1:])
	destino[posicion-1] = movida
	porActo[actoDestinoID] = destino

	resultado := make([]domain.Escena, 0, len(p.Escenas))
	usados := map[string]bool{}
	for _, a := range p.Actos {
		grupo := porActo[a.ID]
		for i := range grupo {
			grupo[i].Orden = i + 1
		}
		resultado = append(resultado, grupo...)
		usados[a.ID] = true
	}

	orfanos := make([]string, 0)
	for actoID := range porActo {
		if !usados[actoID] {
			orfanos = append(orfanos, actoID)
		}
	}
	sort.Strings(orfanos)
	for _, actoID := range orfanos {
		grupo := porActo[actoID]
		for i := range grupo {
			grupo[i].Orden = i + 1
		}
		resultado = append(resultado, grupo...)
	}

	p.Escenas = resultado
	return nil
}

func ordenarPorOrden(escenas []domain.Escena) {
	sort.SliceStable(escenas, func(i, j int) bool { return escenas[i].Orden < escenas[j].Orden })
}

func tieneActo(p *domain.Proyecto, actoID string) bool {
	for _, a := range p.Actos {
		if a.ID == actoID {
			return true
		}
	}
	return false
}

func siguienteOrden(p *domain.Proyecto, actoID string) int {
	max := 0
	for _, e := range p.Escenas {
		if e.ActoID == actoID && e.Orden > max {
			max = e.Orden
		}
	}
	return max + 1
}

func sinConexionesHacia(conexiones []domain.Conexion, destinoID string) []domain.Conexion {
	filtradas := make([]domain.Conexion, 0, len(conexiones))
	for _, c := range conexiones {
		if c.TargetSceneID != destinoID {
			filtradas = append(filtradas, c)
		}
	}
	if len(filtradas) == 0 {
		return nil
	}
	return filtradas
}

func nuevoID(prefijo string) string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return prefijo + "-nuevo"
	}
	return prefijo + "-" + hex.EncodeToString(buf)
}
