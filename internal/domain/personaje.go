package domain

// Personaje representa un personaje del guion/proyecto.
type Personaje struct {
	ID           string `json:"id"`
	Nombre       string `json:"nombre"`
	Descripcion  string `json:"descripcion,omitempty"`
	Personalidad string `json:"personalidad,omitempty"`
	Apariencia   string `json:"apariencia,omitempty"`
	Notas        string `json:"notas,omitempty"`
}

// Ubicacion representa un espacio/lugar dentro del proyecto.
type Ubicacion struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
	Notas       string `json:"notas,omitempty"`
}

// Variable define una variable narrativa (para lógica futura).
type Variable struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Valor       string `json:"valor,omitempty"`
	Tipo        string `json:"tipo,omitempty"`
	Descripcion string `json:"descripcion,omitempty"`
}

// EventoTimeline representa un evento en la línea temporal.
type EventoTimeline struct {
	ID          string `json:"id"`
	Orden       int    `json:"orden"`
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion,omitempty"`
	EscenaID    string `json:"escena_id,omitempty"`
	Fecha       string `json:"fecha,omitempty"`
}
