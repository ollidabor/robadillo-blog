import type { Project } from "@content/types";
import { Tag } from "./Tag";

const statusLabel: Record<Project["status"], string> = {
  live: "live",
  wip: "in progress",
  archived: "shipped",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-xl border border-border bg-bg-elevated p-6 transition-colors hover:border-border-strong">
      <div className="mb-3 flex items-baseline gap-3 font-mono text-xs">
        <span className="text-fg-subtle">{project.period}</span>
        <span
          className={
            project.status === "archived" ? "text-fg-subtle" : "text-accent"
          }
        >
          {statusLabel[project.status]}
        </span>
      </div>

      <h2 className="text-balance text-lg font-semibold tracking-tight text-fg">
        {project.name}
      </h2>

      <p className="mt-2 text-pretty leading-relaxed text-fg-muted">
        {project.summary}
      </p>

      {project.detail && (
        <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">
          {project.detail}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.tech.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>

      {project.links && project.links.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
