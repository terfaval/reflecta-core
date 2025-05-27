interface TokenLogOptions {
  sessionId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export function logTokenUsage({ sessionId, model, promptTokens, completionTokens }: TokenLogOptions) {
  const total = promptTokens + completionTokens;
  console.info(`[🧠 OpenAI] Model: ${model}`);
  console.info(`➡️ Prompt tokens: ${promptTokens}`);
  console.info(`⬅️ Completion tokens: ${completionTokens}`);
  console.info(`📦 Total tokens: ${total}`);
  console.info(`📎 Session: ${sessionId}`);
}
