package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/lalognaviz/guion-studio/internal/domain"
	_ "modernc.org/sqlite"
)

// ProjectRepository es la capa de persistencia del agregado Proyecto.
type ProjectRepository struct {
	sql *sql.DB
}

// DefaultPath devuelve la ruta de guiones.db en el directorio de configuración
// del usuario (una aplicación por usuario, datos locales).
func DefaultPath() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "guiones.db"
	}
	dir = filepath.Join(dir, "guion-studio")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return filepath.Join("guiones.db")
	}
	return filepath.Join(dir, "guiones.db")
}

// Open abre (y crea si no existe) la base de datos, aplica migraciones y el
// seed de desarrollo cuando la base está vacía.
func Open(path string) (*ProjectRepository, error) {
	sqlDB, err := sql.Open("sqlite", "file:"+path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	if err := migrate(sqlDB); err != nil {
		sqlDB.Close()
		return nil, err
	}
	repo := &ProjectRepository{sql: sqlDB}
	if err := repo.seedDemoData(); err != nil {
		sqlDB.Close()
		return nil, err
	}
	return repo, nil
}

// Close cierra la conexión subyacente.
func (r *ProjectRepository) Close() error {
	return r.sql.Close()
}

const schemaV1 = `
	CREATE TABLE IF NOT EXISTS proyectos (
		id TEXT PRIMARY KEY,
		titulo TEXT NOT NULL,
		sinopsis TEXT DEFAULT '',
		ruta_archivo TEXT,
		creado_en TEXT,
		actualizado_en TEXT
	);

	CREATE TABLE IF NOT EXISTS actos (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		orden INTEGER NOT NULL,
		nombre TEXT NOT NULL,
		sinopsis TEXT DEFAULT '',
		plot_point TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS escenas (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		acto_id TEXT NOT NULL,
		orden INTEGER NOT NULL,
		titulo TEXT NOT NULL,
		estado TEXT DEFAULT 'Borrador',
		descripcion TEXT DEFAULT '',
		escaleta TEXT DEFAULT '',
		diseno_nivel TEXT DEFAULT '',
		sonido TEXT DEFAULT '',
		texto_juego TEXT DEFAULT '',
		dialogos TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS conexiones (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		escena_origen_id TEXT NOT NULL,
		escena_destino_id TEXT NOT NULL,
		etiqueta TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_actos_proyecto ON actos(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_escenas_proyecto ON escenas(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_escenas_acto ON escenas(acto_id);
	CREATE INDEX IF NOT EXISTS idx_conexiones_proyecto ON conexiones(proyecto_id);
	CREATE TABLE IF NOT EXISTS opciones (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		escena_id TEXT NOT NULL,
		target_scene_id TEXT,
		texto TEXT NOT NULL,
		orden INTEGER NOT NULL,
		condiciones TEXT DEFAULT '',
		consecuencias TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_opciones_proyecto ON opciones(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_opciones_escena ON opciones(escena_id);

	CREATE TABLE IF NOT EXISTS personajes (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		nombre TEXT NOT NULL,
		descripcion TEXT DEFAULT '',
		personalidad TEXT DEFAULT '',
		apariencia TEXT DEFAULT '',
		notas TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS ubicaciones (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		nombre TEXT NOT NULL,
		descripcion TEXT DEFAULT '',
		notas TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS variables (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		nombre TEXT NOT NULL,
		valor TEXT DEFAULT '',
		tipo TEXT DEFAULT '',
		descripcion TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS timeline (
		id TEXT PRIMARY KEY,
		proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
		orden INTEGER NOT NULL,
		titulo TEXT NOT NULL,
		descripcion TEXT DEFAULT '',
		escena_id TEXT,
		fecha TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_personajes_proyecto ON personajes(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_ubicaciones_proyecto ON ubicaciones(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_variables_proyecto ON variables(proyecto_id);
	CREATE INDEX IF NOT EXISTS idx_timeline_proyecto ON timeline(proyecto_id);

`

const schemaVersion = 1

// migrate lleva la base desde cualquier esquema anterior hasta schemaVersion.
// El esquema previo (ids INTEGER, sin escenas) sólo contenía datos de demo, por
// lo que se descarta y se recrea con el esquema tipado actual.
func migrate(db *sql.DB) error {
	var version int
	if err := db.QueryRow(`PRAGMA user_version`).Scan(&version); err != nil {
		return err
	}
	if version < 1 {
		if err := dropLegacySchema(db); err != nil {
			return err
		}
	}
	if version >= schemaVersion {
		return nil
	}
	if _, err := db.Exec(schemaV1); err != nil {
		return err
	}
	_, err := db.Exec(fmt.Sprintf(`PRAGMA user_version = %d`, schemaVersion))
	return err
}

// dropLegacySchema elimina las tablas del esquema pre-migraciones si detecta
// que la tabla proyectos usaba ids INTEGER.
func dropLegacySchema(db *sql.DB) error {
	rows, err := db.Query(`PRAGMA table_info(proyectos)`)
	if err != nil {
		return err
	}
	defer rows.Close()

	exists := false
	legacyIntID := false
	for rows.Next() {
		var (
			cid       int
			name      string
			ctype     string
			notnull   int
			dfltValue sql.NullString
			pk        int
		)
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			return err
		}
		exists = true
		if name == "id" && !strings.EqualFold(ctype, "TEXT") {
			legacyIntID = true
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if !exists || !legacyIntID {
		return nil
	}
	_, err = db.Exec(`DROP TABLE IF EXISTS conexiones;
		DROP TABLE IF EXISTS escenas;
		DROP TABLE IF EXISTS actos;
		DROP TABLE IF EXISTS proyectos;`)
	return err
}

// seedDemoData inserta dos proyectos de ejemplo sólo si la base está vacía.
func (r *ProjectRepository) seedDemoData() error {
	var count int
	if err := r.sql.QueryRow(`SELECT COUNT(*) FROM proyectos`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	for _, p := range demoProjects() {
		if err := r.GuardarProyecto(p); err != nil {
			return err
		}
	}
	return nil
}

func demoProjects() []domain.Proyecto {
	now := time.Now().Format("2006-01-02 15:04:05")
	estado := "Borrador"
	return []domain.Proyecto{
		{
			ID:            "1",
			Titulo:        "CyberNights",
			Sinopsis:      "Un thriller cyberpunk sobre conspiraciones corporativas.",
			RutaArchivo:   strPtr("/proyectos/cybernights.json"),
			CreadoEn:      "2026-07-25 12:00:00",
			ActualizadoEn: now,
			Actos: []domain.Acto{
				{ID: "act-1", Orden: 1, Nombre: "Planteamiento", Sinopsis: "El protagonista despierta tras la explosión en el mercado y busca refugio.", PlotPoint: "La guardia ataca el mercado; el jugador huye a las alcantarillas."},
				{ID: "act-2", Orden: 2, Nombre: "Confrontación", Sinopsis: "Navegación por los niveles inferiores y descubrimiento de la red de clones.", PlotPoint: "El jugador descubre que es un clon y debe decidir su lealtad."},
				{ID: "act-3", Orden: 3, Nombre: "Resolución", Sinopsis: "Asalto final a la torre corporativa para liberar la ciudad.", PlotPoint: "Batalla final en la aguja corporativa."},
			},
			Escenas: []domain.Escena{
				{ID: "scn-1", ActoID: "act-1", Orden: 1, Titulo: "El Callejón de Inicio", Estado: "Revisado", Descripcion: "El protagonista despierta en un callejón oscuro tras la explosión.", Escaleta: "1. El personaje recupera el sentido entre escombros.\n2. Encuentra una linterna averiada y escucha pasos sospechosos.\n3. Huye por la rejilla del alcantarillado antes de ser visto por la patrulla.", Dialogos: "JUGADOR\n(Confundido)\n¿Dónde estoy?... Mi cabeza me va a explotar."},
				{ID: "scn-2", ActoID: "act-1", Orden: 2, Titulo: "Encuentro con el Mercader", Estado: estado, Descripcion: "Llegada al mercado subterráneo e interactuación con el mercader.", Escaleta: "1. Entrada al mercado iluminado por neones subterráneos.\n2. Conversación con Jax el Mercader.\n3. Intercambio de piezas por la primera arma corta.", Dialogos: "MERCADER\n¡Ey, tú! Acércate al fuego antes de que te congelas."},
				{ID: "scn-3", ActoID: "act-2", Orden: 1, Titulo: "Las Alcantarillas", Estado: estado, Descripcion: "Navegación y combate con mutantes en los túneles del sector 7.", Escaleta: "1. Tramo sigiloso esquivando Mutantes Ciegos.\n2. Resolución del puzle de tuberías de gas.\n3. Emboscada en la tubería principal."},
			},
		},
		{
			ID:            "2",
			Titulo:        "Shadow Realm",
			Sinopsis:      "Fantasía oscura y supervivencia en el reino de las sombras.",
			RutaArchivo:   strPtr("/proyectos/shadow.json"),
			CreadoEn:      "2026-07-25 11:30:00",
			ActualizadoEn: now,
			Actos: []domain.Acto{
				{ID: "act-4", Orden: 1, Nombre: "El Despertar", Sinopsis: "Despertar en la oscuridad.", PlotPoint: "Encuentro con la sombra."},
				{ID: "act-5", Orden: 2, Nombre: "La Caída", Sinopsis: "Descenso al abismo.", PlotPoint: "Traición del aliado."},
				{ID: "act-6", Orden: 3, Nombre: "El Eclipse", Sinopsis: "Batalla final contra la sombra.", PlotPoint: "El eclipse total."},
			},
			Escenas: []domain.Escena{},
		},
	}
}

func strPtr(s string) *string { return &s }
