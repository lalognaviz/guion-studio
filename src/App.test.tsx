import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App, { seedDemoProjects } from './App';

describe('GuionStudio App & Unified Script Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    seedDemoProjects();
  });

  it('renders the Dashboard of Projects by default at root path "/"', async () => {
    render(<App initialRoute="/" />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('CyberNights')).toBeInTheDocument();
    });
    expect(screen.getByText('Shadow Realm')).toBeInTheDocument();
  });

  it('allows creating a brand new project from Dashboard "+ Nuevo Guion" button', async () => {
    render(<App initialRoute="/" />);
    const newProjBtn = screen.getByRole('button', { name: /\+ Nuevo Guion/i });
    fireEvent.click(newProjBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nuevo Proyecto Guion')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Escribe aquí la sinopsis argumental de tu nuevo proyecto/i)).toBeInTheDocument();
    });
  });

  it('allows editing project title and project synopsis directly in DashboardGuion', async () => {
    render(<App initialRoute="/tablero/1" />);
    
    const titleInput = screen.getByDisplayValue('CyberNights');
    fireEvent.change(titleInput, { target: { value: 'CyberNights Remastered' } });
    expect(screen.getByDisplayValue('CyberNights Remastered')).toBeInTheDocument();

    const synopsisInput = screen.getByDisplayValue(/Un thriller cyberpunk sobre conspiraciones corporativas/i);
    fireEvent.change(synopsisInput, { target: { value: 'Sinopsis actualizada para el thriller' } });
    expect(screen.getByDisplayValue('Sinopsis actualizada para el thriller')).toBeInTheDocument();
  });

  it('renders unified DashboardGuion at path "/tablero/1" with 3 act sections', () => {
    render(<App initialRoute="/tablero/1" />);
    expect(screen.getByText('Proyecto Activo')).toBeInTheDocument();

    // 3 Act titles
    expect(screen.getByText(/Planteamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Confrontación/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolución/i)).toBeInTheDocument();

    // Plot Points and Sinopsis
    expect(screen.getByText(/La guardia ataca el mercado; el jugador huye a las alcantarillas\./i)).toBeInTheDocument();

    // Scene titles inside scrollable lists
    expect(screen.getByDisplayValue('El Callejón de Inicio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Encuentro con el Mercader')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Las Alcantarillas')).toBeInTheDocument();

    // Dedicated Editor buttons for each section ("Editar")
    const dedicatedBtns = screen.getAllByRole('button', { name: /^Editar$/i });
    expect(dedicatedBtns.length).toBe(3);
  });

  it('allows creating and editing scenes directly from DashboardGuion', () => {
    render(<App initialRoute="/tablero/1" />);
    
    // Find "+ Nueva Escena" buttons (one per act)
    const addBtns = screen.getAllByRole('button', { name: /\+ Nueva Escena/i });
    expect(addBtns.length).toBe(3);

    // Add a scene to Acto 1
    fireEvent.click(addBtns[0]);
    expect(screen.getByDisplayValue('Nueva Escena 3')).toBeInTheDocument();

    // Edit scene title directly in DashboardGuion
    const newSceneInput = screen.getByDisplayValue('Nueva Escena 3');
    fireEvent.change(newSceneInput, { target: { value: 'Escena de Prueba Directa' } });
    expect(screen.getByDisplayValue('Escena de Prueba Directa')).toBeInTheDocument();
  });

  it('navigates from DashboardGuion to EditorActo when clicking "Editar"', () => {
    render(<App initialRoute="/tablero/1" />);
    const dedicatedBtns = screen.getAllByRole('button', { name: /^Editar$/i });
    fireEvent.click(dedicatedBtns[0]);

    expect(screen.getByText(/Editor Dedicado: Acto 1/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Planteamiento')).toBeInTheDocument();
    expect(screen.getByDisplayValue('El Callejón de Inicio')).toBeInTheDocument();
  });

  it('allows adding a scene and editing scene details inside EditorActo', () => {
    render(<App initialRoute="/tablero/1/acto/act-1" />);
    expect(screen.getByText(/Editor Dedicado: Acto 1/i)).toBeInTheDocument();

    const addSceneBtn = screen.getByRole('button', { name: /\+ Nueva Escena/i });
    fireEvent.click(addSceneBtn);

    expect(screen.getByDisplayValue('Nueva Escena 3')).toBeInTheDocument();
  });

  it('opens maximized scene window inside EditorActo and handles Aceptar / Cancelar', () => {
    render(<App initialRoute="/tablero/1/acto/act-1" />);
    const maximizeBtns = screen.getAllByRole('button', { name: /Maximizar/i });
    expect(maximizeBtns.length).toBeGreaterThan(0);

    // Open Maximize Modal for first scene
    fireEvent.click(maximizeBtns[0]);
    expect(screen.getByText(/Edición Cómoda de Escena y Escaleta Detallada/i)).toBeInTheDocument();

    // Modify Title in draft (inside modal)
    const titleInputs = screen.getAllByDisplayValue('El Callejón de Inicio');
    const modalTitleInput = titleInputs[titleInputs.length - 1];
    fireEvent.change(modalTitleInput, { target: { value: 'Callejón Maximizatorio' } });

    // Click Cancelar
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/Edición Cómoda de Escena/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Callejón Maximizatorio')).not.toBeInTheDocument();

    // Open again and click Aceptar
    fireEvent.click(maximizeBtns[0]);
    const titleInputs2 = screen.getAllByDisplayValue('El Callejón de Inicio');
    const modalTitleInput2 = titleInputs2[titleInputs2.length - 1];
    fireEvent.change(modalTitleInput2, { target: { value: 'Callejón Confirmado' } });

    const acceptBtn = screen.getByRole('button', { name: /✓ Aceptar/i });
    fireEvent.click(acceptBtn);

    expect(screen.getByDisplayValue('Callejón Confirmado')).toBeInTheDocument();
  });

  it('opens Archivo menu and exports Markdown file (.md)', () => {
    render(<App initialRoute="/tablero/1" />);
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:md-test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const saveMdOption = screen.getByText(/Guardar en \.md/i);
    fireEvent.click(saveMdOption);

    expect(screen.getByText(/Guion guardado como "CyberNights\.md"/i)).toBeInTheDocument();
  });

  it('persists newly created projects so they appear in the Dashboard list', async () => {
    render(<App initialRoute="/" />);
    const newProjBtn = screen.getAllByRole('button', { name: /\+ Nuevo Guion/i })[0];
    fireEvent.click(newProjBtn);

    // Edit title of newly created project
    const titleInput = screen.getByDisplayValue('Nuevo Proyecto Guion');
    fireEvent.change(titleInput, { target: { value: 'Proyecto Fantasma' } });

    // Navigate back to Dashboard
    const backBtn = screen.getByRole('button', { name: /← Proyectos/i });
    fireEvent.click(backBtn);

    // Verify 'Proyecto Fantasma' appears in Dashboard list
    await waitFor(() => {
      expect(screen.getByText('Proyecto Fantasma')).toBeInTheDocument();
    });
  });

  it('persists edited project title and synopsis on the Dashboard list', async () => {
    render(<App initialRoute="/tablero/1" />);

    const titleInput = screen.getByDisplayValue('CyberNights');
    fireEvent.change(titleInput, { target: { value: 'CyberNights 2077' } });

    const synopsisInput = screen.getByDisplayValue(/Un thriller cyberpunk sobre conspiraciones corporativas/i);
    fireEvent.change(synopsisInput, { target: { value: 'Nueva sinopsis de CyberNights en el futuro' } });

    // Navigate back to Dashboard
    const backBtn = screen.getByRole('button', { name: /← Proyectos/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText('CyberNights 2077')).toBeInTheDocument();
      expect(screen.getByText('Nueva sinopsis de CyberNights en el futuro')).toBeInTheDocument();
    });
  });

  it('allows hiding a project from Dashboard via ✕ button and modal', async () => {
    render(<App initialRoute="/" />);
    await waitFor(() => {
      expect(screen.getByText('CyberNights')).toBeInTheDocument();
    });

    // Click ✕ on first card
    const dismissBtns = screen.getAllByRole('button', { name: '✕' });
    expect(dismissBtns.length).toBeGreaterThan(0);
    fireEvent.click(dismissBtns[0]);

    // Options modal opens
    expect(screen.getByText(/¿Qué deseas hacer con este proyecto\?/i)).toBeInTheDocument();

    // Click "Quitar de la vista"
    fireEvent.click(screen.getByText(/Quitar de la vista/i));

    await waitFor(() => {
      expect(screen.queryByText('CyberNights')).not.toBeInTheDocument();
    });
  });

  it('allows deleting a project permanently via ✕ button and modal', async () => {
    render(<App initialRoute="/" />);
    await waitFor(() => {
      expect(screen.getByText('Shadow Realm')).toBeInTheDocument();
    });

    // Click ✕ on second card
    const dismissBtns = screen.getAllByRole('button', { name: '✕' });
    expect(dismissBtns.length).toBeGreaterThan(0);
    fireEvent.click(dismissBtns[1]);

    // Options modal opens
    expect(screen.getByText(/¿Qué deseas hacer con este proyecto\?/i)).toBeInTheDocument();

    // Click "Eliminar definitivamente"
    fireEvent.click(screen.getByText(/Eliminar definitivamente/i));

    await waitFor(() => {
      expect(screen.queryByText('Shadow Realm')).not.toBeInTheDocument();
    });
  });

  it('shows welcome empty state and allows creating an example project', async () => {
    localStorage.clear(); // Clear demo projects for this test
    render(<App initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido a GuionStudio!/i)).toBeInTheDocument();
    });

    const exampleBtn = screen.getByRole('button', { name: /Crear Proyecto de Ejemplo/i });
    fireEvent.click(exampleBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('CyberNights')).toBeInTheDocument();
    });
  });

  it('allows adding and removing scene connections in MaximizedSceneModal', () => {
    render(<App initialRoute="/tablero/1/acto/act-1" />);
    
    // Open maximize modal for first scene
    const maximizeBtns = screen.getAllByRole('button', { name: /Maximizar/i });
    fireEvent.click(maximizeBtns[0]);
    
    // Verify connections section exists
    expect(screen.getByText(/Escenas Siguientes \(Conexiones\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sin conexiones/i)).toBeInTheDocument();
    
    // Select target scene (Encuentro con el Mercader)
    const targetSelect = screen.getByDisplayValue('— Seleccionar escena —');
    const options = screen.getAllByRole('option');
    const mercaderOption = options.find((opt) => opt.textContent?.includes('Encuentro con el Mercader'));
    expect(mercaderOption).toBeDefined();
    
    fireEvent.change(targetSelect, { target: { value: mercaderOption?.getAttribute('value') } });
    
    // Enter choice label
    const labelInput = screen.getByPlaceholderText(/Abrir la puerta/i);
    fireEvent.change(labelInput, { target: { value: 'Ir a comprar equipamiento' } });
    
    // Click Conectar button
    const connectBtn = screen.getByRole('button', { name: /Conectar/i });
    fireEvent.click(connectBtn);
    
    // Connection appears in list
    expect(screen.getByText(/Ir a comprar equipamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Encuentro con el Mercader/i)).toBeInTheDocument();
    
    // Accept modal changes
    const acceptBtn = screen.getByRole('button', { name: /✓ Aceptar/i });
    fireEvent.click(acceptBtn);
    
    // Check indicator appears on card
    expect(screen.getByText(/1 conexión/i)).toBeInTheDocument();
  });

  it('opens Archivo menu and exports Twine file (.twee) in Harlowe or SugarCube format', () => {
    render(<App initialRoute="/tablero/1" />);
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:twee-test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const tweeOption = screen.getByText(/Exportar a Twine \(\.twee\)/i);
    fireEvent.click(tweeOption);

    // Modal opens showing format options
    expect(screen.getByText(/Selecciona el formato de historia/i)).toBeInTheDocument();
    expect(screen.getByText(/Harlowe 3\.x/i)).toBeInTheDocument();
    expect(screen.getByText(/SugarCube 2\.x/i)).toBeInTheDocument();

    // Confirm export with Harlowe default
    const exportBtn = screen.getByRole('button', { name: /^Exportar \.twee$/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText(/Guion exportado como "CyberNights\.twee" \(Harlowe\)/i)).toBeInTheDocument();
  });
});
