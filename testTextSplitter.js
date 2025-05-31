import { testTextSplitter } from "./lib/chromaDb.js";
import { loadEnvironmentVariables } from "./lib/setupEnvironment.js";

async function runTest() {
  try {
    const result = await testTextSplitter();
    if (result) {
      console.log("Test completed successfully!");
    } else {
      console.log("Test failed!");
    }
  } catch (error) {
    console.error("Error running test:", error);
  }
}

runTest();
