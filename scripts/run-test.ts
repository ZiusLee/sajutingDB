// Simple test runner for the memory service
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function runMemoryTest() {
  console.log("🚀 Running Memory Service Test...\n")

  try {
    // Run the test script
    const { stdout, stderr } = await execAsync("npx tsx scripts/test-memory-service.ts")

    if (stdout) {
      console.log("📋 Test Output:")
      console.log(stdout)
    }

    if (stderr) {
      console.log("⚠️ Warnings/Errors:")
      console.log(stderr)
    }

    console.log("\n✅ Test execution completed!")
  } catch (error) {
    console.error("❌ Test execution failed:")
    console.error(error)

    // Check if it's a dependency issue
    if (error.message.includes("tsx")) {
      console.log("\n💡 Suggestion: Install tsx globally or locally:")
      console.log("npm install -g tsx")
      console.log("or")
      console.log("npm install --save-dev tsx")
    }

    if (error.message.includes("Cannot find module")) {
      console.log("\n💡 Suggestion: Make sure all dependencies are installed:")
      console.log("npm install")
    }
  }
}

// Run the test
runMemoryTest()
