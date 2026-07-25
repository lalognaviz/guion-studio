import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('GuionStudio App & Unified Script Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Dashboard of Projects by default at root path "/"', async () => {
    render(<App initialRoute="/" />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('CyberNights')).toBeInTheDocument();
    });
    expect(screen.getByText('Shadow Realm')).toBeInTheDocument();
  });

  it('navigates to unified DashboardGuion when clicking "Abrir Guion & Detalles"', async () => {
    render(<App initialRoute="/" />);
    await waitFor(() => {
      expect(screen.getByText('CyberNights')).toBeInTheDocument();
    });

    const abrirBtns = screen.getAllByRole('button', { name: /Abrir Guion & Detalles/i });
    fireEvent.click(abrirBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Proyecto Activo')).toBeInTheDocument();
      expect(screen.getByText('Sinopsis Argumental del Proyecto:')).toBeInTheDocument();
      expect(screen.getByText(/Estructura del Guion por Actos/i)).toBeInTheDocument();
    });
  });

  it('renders unified DashboardGuion at path "/tablero/1" with project details and 3 act sections', () => {
    render(<App initialRoute="/tablero/1" />);
    expect(screen.getByText('Proyecto Activo')).toBeInTheDocument();
    expect(screen.getByText('Ruta de Archivo:')).toBeInTheDocument();
    expect(screen.getByText('Sinopsis Argumental del Proyecto:')).toBeInTheDocument();

    // 3 Act titles
    expect(screen.getByText('Acto 1: Planteamiento')).toBeInTheDocument();
    expect(screen.getByText('Acto 2: Confrontación')).toBeInTheDocument();
    expect(screen.getByText('Acto 3: Resolución')).toBeInTheDocument();

    // Plot Points and Sinopsis
    expect(screen.getByText(/La guardia ataca el mercado; el jugador huye a las alcantarillas\./i)).toBeInTheDocument();

    // Scene titles inside scrollable lists
    expect(screen.getByDisplayValue('El Callejón de Inicio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Encuentro con el Mercader')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Las Alcantarillas')).toBeInTheDocument();

    // Dedicated Editor buttons for each section
    const dedicatedBtns = screen.getAllByRole('button', { name: /Editor Dedicado/i });
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

  it('navigates from DashboardGuion to EditorActo when clicking "Editor Dedicado de Acto 1"', () => {
    render(<App initialRoute="/tablero/1" />);
    const dedicatedBtns = screen.getAllByRole('button', { name: /Editor Dedicado/i });
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
});
