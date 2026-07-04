import { ESCCCore } from './src/services/escc-core';

async function test() {
  console.log("⏳ Contacting the expert panel...");
  const response = await ESCCCore.runPanel({
    title: "Connection Test",
    description: "Respond with exactly the phrase: 'Panel is active and fully operational.'"
  });
  console.log("\n💬 Response from Hermes:\n", response);
}

test();
// File compiled cleanly
