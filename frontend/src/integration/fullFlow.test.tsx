import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App, { seedDemoProjects } from '../App';

describe('Integración completa: ciclo de vida del guion', () => {
  beforeEach(() => {
    localStorage.clear();
    seedDemoProjects();
  });

  it('crea, edita, mueve, conecta, guarda y reabre preservando integridad', async () => {
    // 1. Crear proyecto nuevo desde Dashboard
    render(<App initialRoute="/" />);
    const newProjBtn = screen.getByRole('button', { name: /\+ Nuevo Guion/i });
    fireEvent.click(newProjBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nuevo Proyecto Guion')).toBeInTheDocument();
    });

    // 2. Editar título y sinopsis
    const titleInput = screen.getByDisplayValue('Nuevo Proyecto Guion');
    fireEvent.change(titleInput, { target: { value: 'Proyecto Integración' } });

    const synopsisInput = screen.getByDisplayValue(/Escribe aquí la sinopsis argumental/i);
    fireEvent.change(synopsisInput, { target: { value: 'Sinopsis de prueba para flujo completo' } });

    // 3. Añadir escena al Acto 1 (Planteamiento)
    const addSceneBtns = screen.getAllByRole('button', { name: /\+ Nueva Escena/i });
    expect(addSceneBtns.length).toBe(3);
    fireEvent.click(addSceneBtns[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nueva Escena 1')).toBeInTheDocument();
    });

    // 4. Editar título de la nueva escena
    const sceneTitleInput = screen.getByDisplayValue('Nueva Escena 1');
    fireEvent.change(sceneTitleInput, { target: { value: 'Inicio del Proyecto' } });
    expect(screen.getByDisplayValue('Inicio del Proyecto')).toBeInTheDocument();

    // 5. Añadir otra escena al Acto 1
    fireEvent.click(addSceneBtns[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Nueva Escena 2')).toBeInTheDocument();
    });

    // Editar segunda escena
    const scene2Input = screen.getByDisplayValue('Nueva Escena 2');
    fireEvent.change(scene2Input, { target: { value: 'Desarrollo Inicial' } });

    // 6. Añadir escena al Acto 2 (Confrontación)
    fireEvent.click(addSceneBtns[1]);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Nueva Escena 1')).toBeInTheDocument();
    });

    const scene3Input = screen.getByDisplayValue('Nueva Escena 1');
    fireEvent.change(scene3Input, { target: { value: 'Punto de Giro' } });

    // 7. Abrir modal de maximizar para conectar escenas (Inicio del Proyecto -> Desarrollo Inicial)
    const maximizeBtns = screen.getAllByRole('button', { name: /Maximizar|⛶/i });
    expect(maximizeBtns.length).toBeGreaterThan(0);
    fireEvent.click(maximizeBtns[0]); // Primera escena (Inicio del Proyecto)

    await waitFor(() => {
      expect(screen.getByText(/Edición Cómoda de Escena y Escaleta Detallada/i)).toBeInTheDocument();
    });

    // 8. Conectar escena con "Desarrollo Inicial"
    const targetSelect = screen.getByDisplayValue('— Seleccionar escena —');
    const options = screen.getAllByRole('option');
    const desarrolloOption = options.find((opt) =>
      opt.textContent?.includes('Desarrollo Inicial')
    );
    expect(desarrolloOption).toBeDefined();
    fireEvent.change(targetSelect, {
      target: { value: desarrolloOption?.getAttribute('value') },
    });

    const labelInput = screen.getByPlaceholderText(/Abrir la puerta/i);
    fireEvent.change(labelInput, { target: { value: 'Continúa la historia' } });

    const connectBtn = screen.getByRole('button', { name: /Conectar/i });
    fireEvent.click(connectBtn);

    // Verificar conexión creada
    expect(screen.getByText(/Continúa la historia/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Desarrollo Inicial/i).length).toBeGreaterThan(0);

    // 9. Aceptar cambios en modal
    const acceptBtn = screen.getByRole('button', { name: /✓ Aceptar/i });
    fireEvent.click(acceptBtn);

    // Verificar indicador de conexión en tarjeta
    expect(screen.getByText(/1 conexión/i)).toBeInTheDocument();

    // 10. Guardar proyecto (Archivo -> Guardar)
    const archivoBtn = screen.getByRole('button', { name: /📂 Archivo/i });
    fireEvent.click(archivoBtn);

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:json-test');
    globalThis.URL.revokeObjectURL = vi.fn();

    const saveJsonOption = screen.getByText(/^💾 Guardar$/i);

    fireEvent.click(saveJsonOption);

    await waitFor(() => {
      expect(screen.getByText(/Proyecto "Proyecto Integración" guardado exitosamente/i)).toBeInTheDocument();
    });

    // 11. Volver al Dashboard
    const backBtn = screen.getByRole('button', { name: /← Proyectos/i });
    fireEvent.click(backBtn);

    // 12. Verificar que el proyecto aparece en Dashboard con datos correctos
    await waitFor(() => {
      expect(screen.getByText('Proyecto Integración')).toBeInTheDocument();
      expect(screen.getByText('Sinopsis de prueba para flujo completo')).toBeInTheDocument();
    });

    // 13. Reabrir proyecto desde Dashboard
    const openBtns = screen.getAllByRole('button', { name: /Abrir/i });
    const openBtn = openBtns[openBtns.length - 1];
    fireEvent.click(openBtn);

    // 14. Verificar integridad al reabrir
    await waitFor(() => {
      expect(screen.getByDisplayValue('Proyecto Integración')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sinopsis de prueba para flujo completo')).toBeInTheDocument();
    });

    // Verificar escenas preservadas
    expect(screen.getByDisplayValue('Inicio del Proyecto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Desarrollo Inicial')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Punto de Giro')).toBeInTheDocument();

    // Verificar conexión preservada
    expect(screen.getByText(/1 conexión/i)).toBeInTheDocument();

    // 15. Verificar que está en el tablero correcto con 3 actos
    expect(screen.getByText('Proyecto Activo')).toBeInTheDocument();
    expect(screen.getByText(/Planteamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Confrontación/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolución/i)).toBeInTheDocument();
  });
});
