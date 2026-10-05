import type { Video } from "./types";

/**
 * YouTube videos worth your time. These render as click-to-load cards:
 * nothing is requested from YouTube until a visitor presses play.
 *
 * Add one by grabbing the id from the URL — youtube.com/watch?v=THIS_PART —
 * then run `npm run thumbs` to download its thumbnail locally.
 */
export const videos: Video[] = [
  {
    id: "y8OnoxKotPQ",
    title: "The Thirty Million Line Problem",
    channel: "Casey Muratori",
    note: "The best argument I've heard that our stacks are accidentally enormous. I think about this one when someone proposes a new layer.",
  },
  {
    id: "SxdOUGdseq4",
    title: "Simple Made Easy",
    channel: "Rich Hickey",
    note: "Fifteen years old and still the clearest thing ever said about why 'easy' and 'simple' are different words.",
  },
  {
    id: "rX0ItVEVjHc",
    title: "Data-Oriented Design and C++",
    channel: "CppCon / Mike Acton",
    note: "Not a C++ talk. A talk about actually knowing what your machine is doing, delivered with zero patience for hand-waving.",
  },
];
