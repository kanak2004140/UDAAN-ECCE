import type { Metadata } from "next";
import LearnHub from "@/app/components/learn/LearnHub";

export const metadata: Metadata = { title: "Who is learning? · UDAAN" };

export default function LearnIndexPage() {
  return <LearnHub />;
}
