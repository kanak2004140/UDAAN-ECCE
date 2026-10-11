import { notFound } from "next/navigation";
import AdventurerExperience from "@/app/components/learn/AdventurerExperience";
import ExplorerExperience from "@/app/components/learn/ExplorerExperience";
import ToddlerExperience from "@/app/components/learn/ToddlerExperience";
import { AGE_GROUPS, isAgeGroup } from "@/lib/age/ageConfig";

export function generateStaticParams() {
  return AGE_GROUPS.map((ageGroup) => ({ ageGroup }));
}

/**
 * One route, three genuinely different experiences (not three re-skins):
 * 2-4 is led by the assistant, 4-6 mixes the assistant with picture choices,
 * 6-8 is text first.
 */
export default async function LearnPage({ params }: { params: Promise<{ ageGroup: string }> }) {
  const { ageGroup } = await params;
  if (!isAgeGroup(ageGroup)) notFound();

  switch (ageGroup) {
    case "2-4":
      return <ToddlerExperience />;
    case "4-6":
      return <ExplorerExperience />;
    case "6-8":
      return <AdventurerExperience />;
  }
}
