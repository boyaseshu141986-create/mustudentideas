import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "submit_project",
  title: "Submit a project",
  description:
    "Submit a new project for admin review as the signed-in student (title, description, tech stack and link).",
  inputSchema: {
    title: z.string().trim().min(1).max(150).describe("Project title."),
    description: z.string().trim().max(2000).default("").describe("What the project does."),
    tech_stack: z.string().trim().max(300).default("").describe("Technologies used."),
    project_link: z.string().trim().max(500).default("").describe("Public link to the project."),
    instructions: z.string().trim().max(2000).optional().describe("Transfer instructions for partners."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        student_id: ctx.getUserId(),
        title: input.title,
        description: input.description,
        tech_stack: input.tech_stack,
        project_link: input.project_link,
        instructions: input.instructions ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Submitted "${input.title}" for review.` }],
      structuredContent: { project: data },
    };
  },
});
