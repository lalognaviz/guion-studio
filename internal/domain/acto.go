package domain

// Acto agrupa escenas bajo un punto de trama.
type Acto struct {
	ID        string `json:"id"`
	Orden     int    `json:"orden"`
	Nombre    string `json:"nombre"`
	Sinopsis  string `json:"sinopsis,omitempty"`
	PlotPoint string `json:"plot_point"`
}
