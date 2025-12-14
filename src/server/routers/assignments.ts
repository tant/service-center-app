/**
 * Assignments Router
 * Smart assignment suggestions
 */

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { AssignmentService } from "../services/assignment-service";

export const assignmentsRouter = router({
  // Get assignment suggestion for a task
  getSuggestion: publicProcedure
    .input(z.object({
      taskId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const assignmentService = new AssignmentService(ctx);
      const suggestion = await assignmentService.suggestAssignee(input.taskId);
      return suggestion;
    }),
});
