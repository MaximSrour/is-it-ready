import { type StepState } from "@/config/types";

export const stepIcons: Record<StepState, string> = {
  pending: "  ",
  running: "⏳",
  success: "✅",
  failure: "❌",
};
