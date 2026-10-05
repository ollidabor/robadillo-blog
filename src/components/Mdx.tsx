import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import { Callout } from "./Callout";

const prettyCode: PrettyCodeOptions = {
  /* Two themes in one pass. Shiki writes --shiki-light / --shiki-dark on each
     token and globals.css picks the right one, so switching theme costs no
     JavaScript and no re-highlight. */
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  defaultLang: "text",
  keepBackground: false,
};

/**
 * Anything an MDX file can reference. A post that uses a component not listed
 * here fails the build rather than rendering a blank — which is the behaviour
 * we want, since posts are authored and reviewed in git.
 */
const components = {
  Callout,

  a: ({ href = "", ...props }: React.ComponentProps<"a">) => {
    const internal = href.startsWith("/") || href.startsWith("#");
    if (internal) return <Link href={href} {...props} />;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    );
  },

  img: (props: React.ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img loading="lazy" decoding="async" alt="" {...props} />
  ),
};

export async function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        /* Frontmatter is already parsed by src/lib/posts.ts, so the body we
           pass in has none left to strip. */
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypePrettyCode, prettyCode],
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: {
                  className: ["heading-anchor"],
                  ariaHidden: true,
                  tabIndex: -1,
                },
                content: { type: "text", value: "#" },
              },
            ],
          ],
        },
      }}
    />
  );
}
