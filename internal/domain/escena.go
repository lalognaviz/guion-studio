package domain

// Escena es la unidad narrativa básica dentro de un acto.
type Escena struct {
	ID           string     `json:"id"`
	ActoID       string     `json:"act_id"`
	Orden        int        `json:"orden"`
	Titulo       string     `json:"titulo"`
	Estado       string     `json:"estado"`
	Descripcion  string     `json:"descripcion"`
	Escaleta     string     `json:"escaleta"`
	DisenoNivel  string     `json:"diseno_nivel,omitempty"`
	Sonido       string     `json:"sonido,omitempty"`
	TextoJuego   string     `json:"texto_juego,omitempty"`
	Dialogos     string     `json:"dialogos,omitempty"`
	Conexiones   []Conexion `json:"conexiones,omitempty"`
	Opciones     []Opcion   `json:"opciones,omitempty"`
}
