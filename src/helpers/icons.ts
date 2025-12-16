import { type TaskState } from "task/types";

export const taskStateIcons: Record<TaskState, string> = {
  pending: "  ",
  running: "⏳",
  success: "✅",
  failure: "❌",
};
