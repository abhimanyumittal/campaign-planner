import { understand } from "@/lib/llm/steps";
import { modelId } from "@/lib/llm/models";

const text = process.argv[2] ?? "We sell premium dog food for senior dogs, targeting owners who care about joint health.";
console.log(`Model: ${modelId("default")}`);
console.log(JSON.stringify(await understand(text), null, 2));
