package domain

// Conexion representa una transición narrativa desde una escena hacia otra.
type Conexion struct {
	ID            string `json:"id"`
	TargetSceneID string `json:"target_scene_id"`
	Label         string `json:"label,omitempty"`
}
