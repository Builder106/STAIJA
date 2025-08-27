#!/usr/bin/env -S deno run --allow-net --allow-read

/**
 * Cache Firebase Dependencies for Deno
 * 
 * This script pre-caches Firebase dependencies to improve startup performance.
 * Run this script to download and cache all Firebase modules locally.
 */

const FIREBASE_MODULES = [
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-performance.js"
]

async function cacheDependencies() {
  console.log("🔧 Caching Firebase dependencies for Deno...")
  
  for (const module of FIREBASE_MODULES) {
    try {
      console.log(`📦 Caching: ${module}`)
      const command = new Deno.Command("deno", {
        args: ["cache", module],
        stdout: "inherit",
        stderr: "inherit"
      })
      await command.output()
      console.log(`✅ Cached: ${module}`)
    } catch (error) {
      console.error(`❌ Failed to cache ${module}:`, error instanceof Error ? error.message : String(error))
    }
  }
  
  console.log("🎉 Firebase dependencies cached successfully!")
  console.log("\n📋 Next steps:")
  console.log("1. Set up your environment variables: deno task setup")
  console.log("2. Start the development server: deno task dev")
}

// Run the cache function
if (import.meta.main) {
  cacheDependencies()
}
