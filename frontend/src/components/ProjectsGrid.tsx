import type { ProyectoResumen } from '../lib/types';
import { ProjectCard } from './ProjectCard';

export function ProjectsGrid({
  proyectos,
  onOpen,
  onManage,
}: {
  proyectos: ProyectoResumen[];
  onOpen: (id: string) => void;
  onManage: (proyecto: ProyectoResumen) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proyectos.map((p) => (
        <ProjectCard
          key={p.id}
          proyecto={p}
          onOpen={() => onOpen(p.id)}
          onManage={() => onManage(p)}
        />
      ))}
    </div>
  );
}