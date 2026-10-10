package domain

// Proyecto es el agregado raíz: un guion completo con actos y escenas.
// Los tags JSON coinciden con el contrato de frontend/src/lib/types.ts.
type Proyecto struct {
	ID            string   `json:"id"`
	Titulo        string   `json:"title"`
	Sinopsis      string   `json:"synopsis,omitempty"`
	RutaArchivo   *string  `json:"ruta_archivo,omitempty"`
	Actos         []Acto   `json:"acts"`
	Escenas       []Escena `json:"scenes"`
	CreadoEn      string   `json:"createdAt,omitempty"`
	ActualizadoEn string   `json:"updatedAt"`
}

// ProyectoResumen es la vista ligera usada por el listado del Dashboard.
type ProyectoResumen struct {
	ID          string  `json:"id"`
	Titulo      string  `json:"titulo"`
	RutaArchivo *string `json:"ruta_archivo"`
	Sinopsis    string  `json:"sinopsis"`
	CreadoEn    string  `json:"creado_en"`
}
