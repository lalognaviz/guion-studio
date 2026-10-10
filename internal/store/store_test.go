package store

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/lalognaviz/guion-studio/internal/domain"
)

func openTestDB(t *testing.T) *ProjectRepository {
	t.Helper()
	db, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func TestSeedDemoData(t *testing.T) {
	db := openTestDB(t)

	projects, err := db.ListarProyectos()
	if err != nil {
		t.Fatalf("ListarProyectos: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("esperaba 2 proyectos sembrados, hay %d", len(projects))
	}

	titles := map[string]bool{}
	for _, p := range projects {
		titles[p.Titulo] = true
		if p.ID == "" {
			t.Errorf("proyecto sin id: %+v", p)
		}
	}
	if !titles["CyberNights"] || !titles["Shadow Realm"] {
		t.Errorf("faltan proyectos demo: %+v", projects)
	}
}

func TestSeedEsIdempotente(t *testing.T) {
	db := openTestDB(t)
	if _, err := db.ListarProyectos(); err != nil {
		t.Fatal(err)
	}
	projects, err := db.ListarProyectos()
	if err != nil {
		t.Fatal(err)
	}
	if len(projects) != 2 {
		t.Errorf("el seed debe aplicarse una sola vez, hay %d proyectos", len(projects))
	}
}

func TestObtenerProyectoCompleto(t *testing.T) {
	db := openTestDB(t)

	det, err := db.ObtenerProyecto("1")
	if err != nil {
		t.Fatalf("ObtenerProyecto: %v", err)
	}
	if det.Titulo != "CyberNights" {
		t.Errorf("titulo = %q, quiero CyberNights", det.Titulo)
	}
	if det.Sinopsis == "" {
		t.Error("sinopsis vacía")
	}
	if len(det.Actos) != 3 {
		t.Fatalf("esperaba 3 actos, hay %d", len(det.Actos))
	}
	for i, a := range det.Actos {
		if a.Orden != i+1 {
			t.Errorf("acto %d: orden = %d, quiero %d", i, a.Orden, i+1)
		}
	}
	if det.Actos[0].Nombre != "Planteamiento" {
		t.Errorf("acto 1 = %q, quiero Planteamiento", det.Actos[0].Nombre)
	}
	if len(det.Escenas) != 3 {
		t.Fatalf("esperaba 3 escenas, hay %d", len(det.Escenas))
	}
	if det.Escenas[0].ID != "scn-1" || det.Escenas[0].Titulo == "" {
		t.Errorf("escena inesperada: %+v", det.Escenas[0])
	}
}

func TestObtenerProyectoNoEncontrado(t *testing.T) {
	db := openTestDB(t)

	if _, err := db.ObtenerProyecto("999"); err == nil {
		t.Fatal("esperaba error para proyecto inexistente")
	}
}

func TestGuardarYObtenerGrafoCompleto(t *testing.T) {
	db := openTestDB(t)

	nuevo := domain.Proyecto{
		ID:       "proj-test",
		Titulo:   "Proyecto de Prueba",
		Sinopsis: "Sinopsis de prueba",
		Actos: []domain.Acto{
			{ID: "a1", Orden: 1, Nombre: "Acto Uno", PlotPoint: "PP1"},
			{ID: "a2", Orden: 2, Nombre: "Acto Dos", PlotPoint: "PP2"},
		},
		Escenas: []domain.Escena{
			{ID: "s1", ActoID: "a1", Orden: 1, Titulo: "Escena Uno", Estado: "Borrador",
				Conexiones: []domain.Conexion{{ID: "c1", TargetSceneID: "s2", Label: "Seguir"}}},
			{ID: "s2", ActoID: "a2", Orden: 1, Titulo: "Escena Dos", Estado: "Final"},
		},
	}
	if err := db.GuardarProyecto(nuevo); err != nil {
		t.Fatalf("GuardarProyecto: %v", err)
	}

	got, err := db.ObtenerProyecto("proj-test")
	if err != nil {
		t.Fatalf("ObtenerProyecto: %v", err)
	}
	if got.Titulo != "Proyecto de Prueba" {
		t.Errorf("titulo = %q", got.Titulo)
	}
	if len(got.Actos) != 2 || got.Actos[1].Nombre != "Acto Dos" {
		t.Fatalf("actos inesperados: %+v", got.Actos)
	}
	if len(got.Escenas) != 2 {
		t.Fatalf("escenas inesperadas: %+v", got.Escenas)
	}
	if len(got.Escenas[0].Conexiones) != 1 || got.Escenas[0].Conexiones[0].TargetSceneID != "s2" {
		t.Fatalf("conexiones inesperadas: %+v", got.Escenas[0].Conexiones)
	}
}

func TestGuardarProyectoReemplazaGrafo(t *testing.T) {
	db := openTestDB(t)

	nuevo := domain.Proyecto{
		ID:     "proj-upd",
		Titulo: "V1",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "A1"}},
		Escenas: []domain.Escena{
			{ID: "s1", ActoID: "a1", Orden: 1, Titulo: "S1"},
			{ID: "s2", ActoID: "a1", Orden: 2, Titulo: "S2"},
		},
	}
	if err := db.GuardarProyecto(nuevo); err != nil {
		t.Fatal(err)
	}

	nuevo.Titulo = "V2"
	nuevo.Escenas = []domain.Escena{{ID: "s1", ActoID: "a1", Orden: 1, Titulo: "S1 editada"}}
	if err := db.GuardarProyecto(nuevo); err != nil {
		t.Fatal(err)
	}

	got, err := db.ObtenerProyecto("proj-upd")
	if err != nil {
		t.Fatal(err)
	}
	if got.Titulo != "V2" {
		t.Errorf("titulo = %q, quiero V2", got.Titulo)
	}
	if len(got.Escenas) != 1 || got.Escenas[0].Titulo != "S1 editada" {
		t.Fatalf("esperaba una sola escena actualizada, hay %+v", got.Escenas)
	}
}

func TestEliminarProyecto(t *testing.T) {
	db := openTestDB(t)

	if err := db.GuardarProyecto(domain.Proyecto{ID: "proj-del", Titulo: "Borrar"}); err != nil {
		t.Fatal(err)
	}
	if err := db.EliminarProyecto("proj-del"); err != nil {
		t.Fatalf("EliminarProyecto: %v", err)
	}
	if _, err := db.ObtenerProyecto("proj-del"); err == nil {
		t.Fatal("el proyecto eliminado todavía existe")
	}
}

func TestReabrirConservaDatos(t *testing.T) {
	path := filepath.Join(t.TempDir(), "reopen.db")

	repo, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if err := repo.GuardarProyecto(domain.Proyecto{
		ID:     "persist",
		Titulo: "Persistente",
		Actos:  []domain.Acto{{ID: "a1", Orden: 1, Nombre: "A1"}},
		Escenas: []domain.Escena{
			{ID: "s1", ActoID: "a1", Orden: 1, Titulo: "S1", Estado: "Borrador",
				Conexiones: []domain.Conexion{{ID: "c1", TargetSceneID: "s2"}}},
			{ID: "s2", ActoID: "a1", Orden: 2, Titulo: "S2"},
		},
	}); err != nil {
		t.Fatal(err)
	}
	if err := repo.Close(); err != nil {
		t.Fatal(err)
	}

	repo2, err := Open(path)
	if err != nil {
		t.Fatalf("reabrir: %v", err)
	}
	defer repo2.Close()

	got, err := repo2.ObtenerProyecto("persist")
	if err != nil {
		t.Fatalf("ObtenerProyecto tras reabrir: %v", err)
	}
	if got.Titulo != "Persistente" || len(got.Escenas) != 2 {
		t.Fatalf("grafo perdido al reabrir: %+v", got)
	}
	if len(got.Escenas[0].Conexiones) != 1 {
		t.Errorf("conexiones perdidas al reabrir: %+v", got.Escenas[0].Conexiones)
	}

	projects, err := repo2.ListarProyectos()
	if err != nil {
		t.Fatal(err)
	}
	if len(projects) != 3 {
		t.Errorf("esperaba 2 demos + 1 proyecto, hay %d", len(projects))
	}
}

func TestMigracionDescartaEsquemaAntiguo(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")

	raw, err := sql.Open("sqlite", "file:"+path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := raw.Exec(`
		CREATE TABLE proyectos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			titulo TEXT NOT NULL,
			ruta_archivo TEXT,
			sinopsis TEXT DEFAULT '',
			creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE actos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			proyecto_id INTEGER NOT NULL,
			titulo TEXT NOT NULL,
			orden INTEGER NOT NULL
		);
		INSERT INTO proyectos (id, titulo) VALUES (1, 'Viejo Proyecto');`); err != nil {
		t.Fatal(err)
	}
	raw.Close()

	db, err := Open(path)
	if err != nil {
		t.Fatalf("Open sobre esquema antiguo: %v", err)
	}
	defer db.Close()

	projects, err := db.ListarProyectos()
	if err != nil {
		t.Fatal(err)
	}
	if len(projects) != 2 {
		t.Fatalf("esperaba el seed en la base migrada, hay %d proyectos", len(projects))
	}
	for _, p := range projects {
		if p.Titulo == "Viejo Proyecto" {
			t.Error("el esquema antiguo no debería sobrevivir a la migración")
		}
	}
}
