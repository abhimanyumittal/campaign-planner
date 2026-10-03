import fs from "node:fs";
import path from "node:path";

export function fillPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`Prompt variable "${key}" was not provided`);
    return vars[key];
  });
}

export function loadPrompt(file: string, vars: Record<string, string> = {}): string {
  const template = fs.readFileSync(path.join(process.cwd(), "prompts", file), "utf8");
  return fillPrompt(template, vars);
}

export const wrapDescription = (text: string) => `<advertiser_description>\n${text}\n</advertiser_description>`;
