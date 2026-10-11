package domain

// Opcion representa una elección narrativa asociada a una escena.
type Opcion struct {
	ID              string `json:"id"`
	EscenaID        string `json:"escena_id"`
	TargetSceneID   string `json:"target_scene_id"`
	Texto           string `json:"texto"`
	Orden           int    `json:"orden"`
	Condiciones     string `json:"condiciones,omitempty"`
	Consecuencias   string `json:"consecuencias,omitempty"`
}

// Choice alias para inglés
type Choice = Opcion

// Condicion (placeholder para futuro; almacenado como string por ahora)
type Condicion struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Expresion   string `json:"expresion,omitempty"`
	Descripcion string `json:"descripcion,omitempty"`
}

// Condition alias
type Condition = Condicion
