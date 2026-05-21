import type { ImageSourcePropType } from "react-native";

export type TabKey = "recommend" | "category" | "profile";

export type IssueItem = {
  id: string;
  title: string;
  shortSummary: string;
  fullText?: string;
  category: string;
  reportCount: number;
  sources: string[];
  createdAt: string;
  image: ImageSourcePropType;
  sourceLogos: ImageSourcePropType[];
  featured?: boolean;
};
