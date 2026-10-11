package application

import (
	"path/filepath"
	"testing"

	"github.com/lalognaviz/guion-studio/internal/domain"
	"github.com/lalognaviz/guion-studio/internal/store"
)

func newTestServices(t *testing.T) (*ProjectService, *SceneService, *store.ProjectRepository) {
	t.Helper()
	repo, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { repo.Close() })
	return NewProjectService(repo), NewSceneService(repo), repo
}

func TestCrearEscenaAlFinalDelActo(t *testing.T) {
	_, scenes, _ := newTestServices(t)

	escena, err := scenes.CrearEscena("1", "act-1", "")
	if err != nil {
		t.Fatalf("CrearEscena: %v", err)
	}
	if escena.ID == "" {
		t.Error("la escena creada no tiene id")
	}
	if escena.ActoID != "act-1" {
		t.Errorf("acto = %q, quiero act-1", escena.ActoID)
	}
	if escena.Orden != 3 {
		t.Errorf("orden = %d, quiero 3 (tras scn-1 y scn-2)", escena.Orden)
	}
	if escena.Titulo != "Nueva Escena 3" {
		t.Errorf("titulo = %q, quiero el generado", escena.Titulo)
	}
}

func TestCrearEscenaActoInexistente(t *testing.T) {
	_, scenes, _ := newTestServices(t)

	if _, err := scenes.CrearEscena("1", "acto-fantasma", ""); err == nil {
		t.Fatal("esperaba error para un acto inexistente")
	}
}

func TestEliminarEscenaQuitaConexionesEntrantes(t *testing.T) {
	_, scenes, repo := newTestServices(t)

	proyecto := domain.Proyecto{
		ID:     "proj-esc",
		Titulo: "Proyecto Escenas",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "A1"}},
		Escenas: []domain.Escena{
			{ID: "s1", ActoID: "a1", Orden: 1, Titulo: "S1",
				Conexiones: []domain.Conexion{{ID: "c1", TargetSceneID: "s2", Label: "Ir"}}},
			{ID: "s2", ActoID: "a1", Orden: 2, Titulo: "S2"},
		},
	}
	if err := repo.GuardarProyecto(proyecto); err != nil {
		t.Fatal(err)
	}

	if err := scenes.EliminarEscena("proj-esc", "s2"); err != nil {
		t.Fatalf("EliminarEscena: %v", err)
	}

	got, err := repo.ObtenerProyecto("proj-esc")
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Escenas) != 1 {
		t.Fatalf("esperaba 1 escena, hay %d", len(got.Escenas))
	}
	if len(got.Escenas[0].Conexiones) != 0 {
		t.Errorf("la conexión hacia la escena borrada debe desaparecer, quedan %+v", got.Escenas[0].Conexiones)
	}
}

func TestGuardarProyectoRequiereTitulo(t *testing.T) {
	projects, _, _ := newTestServices(t)

	if err := projects.GuardarProyecto(domain.Proyecto{ID: "x"}); err == nil {
		t.Fatal("esperaba error al guardar un proyecto sin título")
	}
}

func proyectoTresMasUno(t *testing.T, repo *store.ProjectRepository) {
	t.Helper()
	proyecto := domain.Proyecto{
		ID:     "proj-mov",
		Titulo: "Movimiento",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "A1"}, {ID: "a2", Orden: 2, Nombre: "A2"}},
		Escenas: []domain.Escena{
			{ID: "A", ActoID: "a1", Orden: 1, Titulo: "A"},
			{ID: "B", ActoID: "a1", Orden: 2, Titulo: "B"},
			{ID: "C", ActoID: "a1", Orden: 3, Titulo: "C"},
			{ID: "D", ActoID: "a2", Orden: 1, Titulo: "D"},
		},
	}
	if err := repo.GuardarProyecto(proyecto); err != nil {
		t.Fatal(err)
	}
}

func titulosDeActo(t *testing.T, repo *store.ProjectRepository, proyectoID, actoID string) []string {
	t.Helper()
	got, err := repo.ObtenerProyecto(proyectoID)
	if err != nil {
		t.Fatal(err)
	}
	var titulos []string
	for _, e := range got.Escenas {
		if e.ActoID == actoID {
			titulos = append(titulos, e.Titulo)
		}
	}
	return titulos
}

func TestMoverEscenaEntreActos(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if err := scenes.MoverEscena("proj-mov", "C", "a2", 1); err != nil {
		t.Fatalf("MoverEscena: %v", err)
	}

	if got := titulosDeActo(t, repo, "proj-mov", "a1"); !equal(got, []string{"A", "B"}) {
		t.Errorf("acto 1 = %v, quiero [A B]", got)
	}
	if got := titulosDeActo(t, repo, "proj-mov", "a2"); !equal(got, []string{"C", "D"}) {
		t.Errorf("acto 2 = %v, quiero [C D]", got)
	}
}

func TestMoverEscenaAlFinal(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if err := scenes.MoverEscena("proj-mov", "A", "a2", 99); err != nil {
		t.Fatalf("MoverEscena: %v", err)
	}
	if got := titulosDeActo(t, repo, "proj-mov", "a2"); !equal(got, []string{"D", "A"}) {
		t.Errorf("acto 2 = %v, quiero [D A]", got)
	}
}

func TestReordenarEscena(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if err := scenes.ReordenarEscena("proj-mov", "C", 1); err != nil {
		t.Fatalf("ReordenarEscena: %v", err)
	}
	if got := titulosDeActo(t, repo, "proj-mov", "a1"); !equal(got, []string{"C", "A", "B"}) {
		t.Errorf("acto 1 = %v, quiero [C A B]", got)
	}
}

func TestConectarEscenasRechazaAutoReferencia(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if _, err := scenes.ConectarEscenas("proj-mov", "A", "A", ""); err == nil {
		t.Fatal("esperaba error por autorreferencia")
	}
}

func TestConectarEscenasRechazaDuplicado(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if _, err := scenes.ConectarEscenas("proj-mov", "A", "B", "Ir"); err != nil {
		t.Fatalf("primera conexión: %v", err)
	}
	if _, err := scenes.ConectarEscenas("proj-mov", "A", "B", "Otra"); err == nil {
		t.Fatal("esperaba error por conexión duplicada")
	}
}

func TestConectarYDesconectarEscenas(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	conn, err := scenes.ConectarEscenas("proj-mov", "A", "B", "Seguir")
	if err != nil {
		t.Fatalf("ConectarEscenas: %v", err)
	}
	if conn.ID == "" {
		t.Error("la conexión no tiene id")
	}

	escena, _ := repo.ObtenerProyecto("proj-mov")
	var conexiones int
	for _, e := range escena.Escenas {
		conexiones += len(e.Conexiones)
	}
	if conexiones != 1 {
		t.Fatalf("esperaba 1 conexión, hay %d", conexiones)
	}

	if err := scenes.DesconectarEscenas("proj-mov", conn.ID); err != nil {
		t.Fatalf("DesconectarEscenas: %v", err)
	}
	escena, _ = repo.ObtenerProyecto("proj-mov")
	for _, e := range escena.Escenas {
		if len(e.Conexiones) != 0 {
			t.Errorf("quedaron conexiones: %+v", e.Conexiones)
		}
	}
}

func TestCambiarEstadoEscena(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if err := scenes.CambiarEstadoEscena("proj-mov", "A", "Final"); err != nil {
		t.Fatalf("CambiarEstadoEscena: %v", err)
	}
	if err := scenes.CambiarEstadoEscena("proj-mov", "A", "Inexistente"); err == nil {
		t.Fatal("esperaba error para un estado no válido")
	}
	escena, _ := repo.ObtenerProyecto("proj-mov")
	for _, e := range escena.Escenas {
		if e.ID == "A" && e.Estado != "Final" {
			t.Errorf("estado = %q, quiero Final", e.Estado)
		}
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
