import type { Metadata } from "next";
import { videos } from "@content/videos";
import { tweets } from "@content/tweets";
import { thumbnailFor } from "@/lib/thumbs";
import { PageHeader } from "@/components/PageHeader";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { TweetCard } from "@/components/TweetCard";

export const metadata: Metadata = {
  title: "Al día",
  description:
    "Videos worth your time and posts worth reading — the stuff I'd send you in a DM.",
  alternates: { canonical: "/al-dia" },
};

export default function AlDiaPage() {
  /* Thumbnails are resolved here, on the server at build time, so the client
     component never needs filesystem access or a YouTube request. */
  const withThumbs = videos.map((video) => ({
    video,
    thumbnail: thumbnailFor(video.id),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Al día"
        title="Stay caught up"
        lead="Videos worth your time and posts worth reading — roughly the stuff I'd send you in a DM. Nothing loads from YouTube or X until you ask it to."
      />

      <section className="mb-24">
        <h2 className="mb-8 border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">
          Watch
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {withThumbs.map(({ video, thumbnail }) => (
            <YouTubeEmbed key={video.id} video={video} thumbnail={thumbnail} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-8 border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">
          Read
        </h2>

        <div className="grid items-start gap-5 sm:grid-cols-2">
          {tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      </section>
    </>
  );
}
