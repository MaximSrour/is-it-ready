import { type TaskState } from "@/config/types";

export const taskStateIcons: Record<TaskState, string> = {
  pending: "  ",
  running: "⏳",
  success: "✅",
  failure: "❌",
};
