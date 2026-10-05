import { site } from "@content/site";
import { SocialIcon } from "./SocialIcon";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-xs text-fg-subtle">
          © {new Date().getFullYear()} {site.name} · {site.location}
        </p>

        <ul className="flex items-center gap-4">
          {site.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                className="flex items-center gap-1.5 text-fg-subtle transition-colors hover:text-fg"
                /* noreferrer keeps the visitor's current URL out of the
                   destination's logs; noopener severs window.opener. */
                {...(social.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <SocialIcon icon={social.icon} />
                <span className="sr-only">{social.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
