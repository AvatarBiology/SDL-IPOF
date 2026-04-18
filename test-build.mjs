import { build } from 'vite';
import config from './vite.config.ts';

// We override env logic to simulate GitHub Actions where GEMINI_API_KEY is missing
process.env.GEMINI_API_KEY = ''; 

async function test() {
  try {
    await build();
    console.log("BUILD SUCCESSFUL");
  } catch(e) {
    console.error("BUILD FAILED:", e);
    process.exit(1);
  }
}
test();
