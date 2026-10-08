import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { Dashboard } from './pages/Dashboard';
import { DashboardGuion, DetallesProyecto } from './pages/DashboardGuion';
import { EditorActo } from './pages/EditorActo';

// Re-export público: los consumidores siguen importando desde ./App
export * from './lib/types';
export * from './lib/storage';
export * from './api/client';
export { Dashboard, DashboardGuion, DetallesProyecto, EditorActo };

// -------------------------------------------------------------
// MAIN APP ROUTER COMPONENT (MemoryRouter)
// -------------------------------------------------------------
export default function App({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/proyecto/:id" element={<DashboardGuion />} />
        <Route path="/tablero/:id" element={<DashboardGuion />} />
        <Route path="/tablero/:id/acto/:actoId" element={<EditorActo />} />
      </Routes>
    </MemoryRouter>
  );
}
