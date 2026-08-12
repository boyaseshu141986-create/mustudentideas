import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list-projects";
import submitProjectTool from "./tools/submit-project";
import listIdeasTool from "./tools/list-ideas";
import listSkillVideosTool from "./tools/list-skill-videos";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "connect-grow",
  title: "Connect & Grow",
  version: "0.1.0",
  instructions:
    "Tools for the Marwadi Innovation Hub. Read student projects, mentor idea questions and skill-learning videos, and submit a new project for admin review. All access runs as the signed-in member.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjectsTool, submitProjectTool, listIdeasTool, listSkillVideosTool],
});
