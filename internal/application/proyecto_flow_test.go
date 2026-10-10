package application

import (
	"testing"

	"github.com/lalognaviz/guion-studio/internal/domain"
)

// TestFlujoCompletoCrearGrafoYReleer recorre el flujo real de la aplicación:
// crear proyecto -> crear escenas -> conectar -> cambiar estado -> releer.
func TestFlujoCompletoCrearGrafoYReleer(t *testing.T) {
	projects, scenes, repo := newTestServices(t)

	proyecto := domain.Proyecto{
		ID:     "flow",
		Titulo: "Flujo Completo",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "Acto 1", PlotPoint: "PP"}},
	}
	if err := projects.GuardarProyecto(proyecto); err != nil {
		t.Fatalf("GuardarProyecto: %v", err)
	}

	inicio, err := scenes.CrearEscena("flow", "a1", "Inicio")
	if err != nil {
		t.Fatalf("CrearEscena inicio: %v", err)
	}
	fin, err := scenes.CrearEscena("flow", "a1", "Fin")
	if err != nil {
		t.Fatalf("CrearEscena fin: %v", err)
	}
	if inicio.Orden != 1 || fin.Orden != 2 {
		t.Fatalf("orden inesperado: inicio=%d fin=%d", inicio.Orden, fin.Orden)
	}

	conn, err := scenes.ConectarEscenas("flow", inicio.ID, fin.ID, "Continuar")
	if err != nil {
		t.Fatalf("ConectarEscenas: %v", err)
	}
	if err := scenes.CambiarEstadoEscena("flow", inicio.ID, "Revisado"); err != nil {
		t.Fatalf("CambiarEstadoEscena: %v", err)
	}

	got, err := repo.ObtenerProyecto("flow")
	if err != nil {
		t.Fatalf("ObtenerProyecto: %v", err)
	}
	if len(got.Actos) != 1 || len(got.Escenas) != 2 {
		t.Fatalf("grafo incompleto: %d actos, %d escenas", len(got.Actos), len(got.Escenas))
	}

	var encontradaInicio bool
	for _, e := range got.Escenas {
		if e.ID != inicio.ID {
			continue
		}
		encontradaInicio = true
		if e.Estado != "Revisado" {
			t.Errorf("estado = %q, quiero Revisado", e.Estado)
		}
		if len(e.Conexiones) != 1 || e.Conexiones[0].ID != conn.ID {
			t.Errorf("conexiones inesperadas: %+v", e.Conexiones)
		}
		if e.Conexiones[0].TargetSceneID != fin.ID {
			t.Errorf("destino = %q, quiero %q", e.Conexiones[0].TargetSceneID, fin.ID)
		}
	}
	if !encontradaInicio {
		t.Fatal("la escena de inicio no está en el grafo releído")
	}
}

// TestEliminarEscenaEnCadena verifica la regla del plan: dado A->B->C, al
// eliminar B desaparecen A->B y B->C, mientras A y C siguen existiendo.
func TestEliminarEscenaEnCadena(t *testing.T) {
	_, scenes, repo := newTestServices(t)

	proyecto := domain.Proyecto{
		ID:     "chain",
		Titulo: "Cadena",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "A1"}},
		Escenas: []domain.Escena{
			{ID: "A", ActoID: "a1", Orden: 1, Titulo: "A",
				Conexiones: []domain.Conexion{{ID: "cAB", TargetSceneID: "B"}}},
			{ID: "B", ActoID: "a1", Orden: 2, Titulo: "B",
				Conexiones: []domain.Conexion{{ID: "cBC", TargetSceneID: "C"}}},
			{ID: "C", ActoID: "a1", Orden: 3, Titulo: "C"},
		},
	}
	if err := repo.GuardarProyecto(proyecto); err != nil {
		t.Fatal(err)
	}

	if err := scenes.EliminarEscena("chain", "B"); err != nil {
		t.Fatalf("EliminarEscena: %v", err)
	}

	got, err := repo.ObtenerProyecto("chain")
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Escenas) != 2 {
		t.Fatalf("esperaba A y C, hay %d escenas: %+v", len(got.Escenas), got.Escenas)
	}
	for _, e := range got.Escenas {
		if e.ID == "B" {
			t.Error("B debería haber sido eliminada")
		}
		if len(e.Conexiones) != 0 {
			t.Errorf("la escena %q no debería tener conexiones, tiene %+v", e.ID, e.Conexiones)
		}
	}
}

// TestOperacionesDeGrafoIndependientes comprueba connect, disconnect y delete
// como operaciones aisladas sobre el mismo grafo.
func TestOperacionesDeGrafoIndependientes(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	ab, err := scenes.ConectarEscenas("proj-mov", "A", "B", "AB")
	if err != nil {
		t.Fatal(err)
	}
	bc, err := scenes.ConectarEscenas("proj-mov", "B", "C", "BC")
	if err != nil {
		t.Fatal(err)
	}

	if err := scenes.DesconectarEscenas("proj-mov", ab.ID); err != nil {
		t.Fatalf("DesconectarEscenas: %v", err)
	}
	if err := scenes.DesconectarEscenas("proj-mov", "conn-inexistente"); err == nil {
		t.Fatal("esperaba error al desconectar una conexión inexistente")
	}

	got, _ := repo.ObtenerProyecto("proj-mov")
	conexiones := map[string]int{}
	for _, e := range got.Escenas {
		conexiones[e.ID] = len(e.Conexiones)
	}
	if conexiones["A"] != 0 || conexiones["B"] != 1 || conexiones["C"] != 0 {
		t.Fatalf("grafo inesperado tras desconectar AB: %+v", conexiones)
	}

	if err := scenes.EliminarEscena("proj-mov", "B"); err != nil {
		t.Fatal(err)
	}
	got, _ = repo.ObtenerProyecto("proj-mov")
	for _, e := range got.Escenas {
		if len(e.Conexiones) != 0 {
			t.Errorf("%s conserva conexiones tras borrar B: %+v", e.ID, e.Conexiones)
		}
	}
	if bc.TargetSceneID != "C" {
		t.Errorf("la conexión BC apuntaba a %q", bc.TargetSceneID)
	}
}

// TestMoverReordenaActosDejaOrdenContiguo verifica que mover renumera el orden
// de los actos afectados sin huecos.
func TestMoverReordenaActosDejaOrdenContiguo(t *testing.T) {
	_, scenes, repo := newTestServices(t)
	proyectoTresMasUno(t, repo)

	if err := scenes.MoverEscena("proj-mov", "B", "a2", 1); err != nil {
		t.Fatal(err)
	}
	if err := scenes.MoverEscena("proj-mov", "C", "a1", 1); err != nil {
		t.Fatal(err)
	}

	got, _ := repo.ObtenerProyecto("proj-mov")
	ordenPorActo := map[string][]int{}
	for _, e := range got.Escenas {
		ordenPorActo[e.ActoID] = append(ordenPorActo[e.ActoID], e.Orden)
	}
	for actoID, ordenes := range ordenPorActo {
		esperado := 1
		for _, o := range sorted(ordenes) {
			if o != esperado {
				t.Errorf("acto %s: orden %v no es contiguo desde 1", actoID, ordenes)
				break
			}
			esperado++
		}
	}
}

func sorted(valores []int) []int {
	resultado := append([]int(nil), valores...)
	for i := 1; i < len(resultado); i++ {
		for j := i; j > 0 && resultado[j-1] > resultado[j]; j-- {
			resultado[j-1], resultado[j] = resultado[j], resultado[j-1]
		}
	}
	return resultado
}
