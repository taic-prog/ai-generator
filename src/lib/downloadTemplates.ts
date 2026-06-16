import { AGENT_TEMPLATES, BASE_TEMPLATE_FILES, getAgentTemplateFile } from "./agentTemplates";
import { triggerDownload } from "./triggerDownload";

export async function downloadAgentTemplates(selectedAgentIds: string[]) {
  const agentFiles = AGENT_TEMPLATES.filter((agent) => selectedAgentIds.includes(agent.id)).map(
    getAgentTemplateFile
  );
  const files = [...BASE_TEMPLATE_FILES, ...agentFiles];

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.path, file.content));
  const blob = await zip.generateAsync({ type: "blob" });

  triggerDownload(blob, "claude-code-templates.zip");
}
