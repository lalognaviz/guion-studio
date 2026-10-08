package store

import (
	"path/filepath"
	"testing"
)

func openTestDB(t *testing.T) *DB {
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

	projects, err := db.ProyectosRecientes()
	if err != nil {
		t.Fatalf("ProyectosRecientes: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("esperaba 2 proyectos sembrados, hay %d", len(projects))
	}
	if projects[0].Titulo != "CyberNights" && projects[1].Titulo != "CyberNights" {
		t.Errorf("CyberNights no está en la lista: %+v", projects)
	}
}

func TestProyectosRecientesIsIdempotent(t *testing.T) {
	db := openTestDB(t)
	if _, err := db.ProyectosRecientes(); err != nil {
		t.Fatal(err)
	}
	projects, err := db.ProyectosRecientes()
	if err != nil {
		t.Fatal(err)
	}
	if len(projects) != 2 {
		t.Errorf("el seed debe aplicarse una sola vez, hay %d proyectos", len(projects))
	}
}

func TestDetallesProyecto(t *testing.T) {
	db := openTestDB(t)

	det, err := db.DetallesProyecto(1)
	if err != nil {
		t.Fatalf("DetallesProyecto: %v", err)
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
	if det.Actos[0].Titulo != "Planteamiento" {
		t.Errorf("acto 1 = %q, quiero Planteamiento", det.Actos[0].Titulo)
	}
}

func TestDetallesProyectoNoEncontrado(t *testing.T) {
	db := openTestDB(t)

	if _, err := db.DetallesProyecto(999); err == nil {
		t.Fatal("esperaba error para proyecto inexistente")
	}
}
