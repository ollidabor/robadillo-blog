import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { site } from "@content/site";
import { PageHeader } from "@/components/PageHeader";
import { Mdx } from "@/components/Mdx";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
  alternates: { canonical: "/about" },
};

/* The page copy lives in content/about.mdx so editing it never means touching
   a component. Read at build time; nothing here runs in a browser. */
function readAbout(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "content", "about.mdx"),
    "utf8",
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-measure">
      <PageHeader eyebrow="About" title={`Hey, I'm ${site.name.split(" ")[0]}`} />
      <div className="prose">
        <Mdx source={readAbout()} />
      </div>
    </div>
  );
}
