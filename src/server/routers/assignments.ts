/**
 * Assignments Router
 * Smart assignment suggestions
 */

import { z } from "zod";
import { AssignmentService } from "../services/assignment-service";
import { publicProcedure, router } from "../trpc";

export const assignmentsRouter = router({
  // Get assignment suggestion for a task
  getSuggestion: publicProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const assignmentService = new AssignmentService(ctx);
      const suggestion = await assignmentService.suggestAssignee(input.taskId);
      return suggestion;
    }),
});
