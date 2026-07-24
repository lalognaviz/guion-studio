import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

describe('GuionStudio App Component', () => {
  it('renders the header and main title', () => {
    render(<App />);
    expect(screen.getByText('GuionStudio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CyberNights')).toBeInTheDocument();
  });

  it('renders initial narrative acts and compact scene list', () => {
    render(<App />);
    expect(screen.getByText(/Acto 1: Planteamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Acto 2: Confrontación/i)).toBeInTheDocument();
    expect(screen.getByText(/Acto 3: Resolución/i)).toBeInTheDocument();

    expect(screen.getByText('El Callejón de Inicio')).toBeInTheDocument();
    expect(screen.getByText('Encuentro con el Mercader')).toBeInTheDocument();
    expect(screen.getByText('Las Alcantarillas')).toBeInTheDocument();
  });

  it('opens Archivo dropdown menu and executes Guardar action', () => {
    render(<App />);
    
    // Open Archivo menu
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    expect(screen.getByText('Nuevo Proyecto')).toBeInTheDocument();
    expect(screen.getByText('Abrir Proyecto...')).toBeInTheDocument();
    expect(screen.getByText('Guardar Como...')).toBeInTheDocument();
    expect(screen.getByText('Guardar en .md')).toBeInTheDocument();
    expect(screen.getByText('Lector Markdown (.md)')).toBeInTheDocument();

    // Mock URL functions
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const saveMenuOption = screen.getByText('Guardar (.json)');
    fireEvent.click(saveMenuOption);

    expect(screen.getByText(/Proyecto "CyberNights" guardado exitosamente/i)).toBeInTheDocument();
  });

  it('opens Guardar Como modal and executes save', () => {
    render(<App />);
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    const saveAsOption = screen.getByText('Guardar Como...');
    fireEvent.click(saveAsOption);

    expect(screen.getByText(/Guardar Proyecto Como\.\.\./i)).toBeInTheDocument();

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:save-as');
    globalThis.URL.revokeObjectURL = vi.fn();

    const directDownloadBtn = screen.getByRole('button', { name: /Descarga Directa \(\.json\)/i });
    fireEvent.click(directDownloadBtn);

    expect(screen.getByText(/Proyecto guardado como "CyberNights"/i)).toBeInTheDocument();
  });

  it('opens maximized scene window and handles Aceptar / Cancelar', () => {
    render(<App />);
    const maximizeBtns = screen.getAllByTitle('Maximizar escena para edición cómoda');
    expect(maximizeBtns.length).toBeGreaterThan(0);

    // Open Maximize Modal for first scene
    fireEvent.click(maximizeBtns[0]);
    expect(screen.getByText(/Edición Cómoda de Escena y Escaleta Detallada/i)).toBeInTheDocument();

    // Modify Title in draft
    const titleInput = screen.getByDisplayValue('El Callejón de Inicio');
    fireEvent.change(titleInput, { target: { value: 'Callejón Maximizatorio' } });

    // Click Cancelar (first available)
    const cancelBtns = screen.getAllByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtns[0]);
    expect(screen.queryByText(/Edición Cómoda de Escena/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Callejón Maximizatorio')).not.toBeInTheDocument();

    // Open again and click Aceptar
    fireEvent.click(maximizeBtns[0]);
    const titleInput2 = screen.getByDisplayValue('El Callejón de Inicio');
    fireEvent.change(titleInput2, { target: { value: 'Callejón Confirmado' } });

    const acceptBtns = screen.getAllByRole('button', { name: /✓ Aceptar/i });
    fireEvent.click(acceptBtns[0]);

    expect(screen.getByText('Callejón Confirmado')).toBeInTheDocument();
  });

  it('exports project as Markdown file (.md)', () => {
    render(<App />);
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:md-test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const saveMdOption = screen.getByText('Guardar en .md');
    fireEvent.click(saveMdOption);

    expect(screen.getByText(/Guion guardado como "CyberNights.md"/i)).toBeInTheDocument();
  });

  it('adds a new scene when clicking "+ Nueva Escena"', () => {
    render(<App />);
    const addSceneButtons = screen.getAllByRole('button', { name: /\+ Nueva Escena/i });
    expect(addSceneButtons.length).toBe(3);

    fireEvent.click(addSceneButtons[0]);
    expect(screen.getByText('Nueva Escena 3')).toBeInTheDocument();
  });

  it('moves a scene to another act using the act selector dropdown', () => {
    render(<App />);
    const actSelects = screen.getAllByTitle('Mover de acto');
    expect(actSelects.length).toBeGreaterThan(0);

    // Change first scene to Act 2
    fireEvent.change(actSelects[0], { target: { value: 'act-2' } });
  });

  it('toggles narrative AI assistant sidebar', () => {
    render(<App />);
    expect(screen.getByText('Asistente Narrativo')).toBeInTheDocument();
    const closeAiBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeAiBtn);
  });
});
