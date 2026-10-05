import type { Metadata } from "next";
import { projects } from "@content/projects";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCard } from "@/components/ProjectCard";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Things I've built and shipped — marketplaces, checkout flows, notification infrastructure and side projects.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Things I've built"
        lead="Some of it shipped to millions of people, some of it is a weekend experiment. Both kinds taught me something."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </>
  );
}
