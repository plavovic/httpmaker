import { defineConfig,devices } from "@playwright/test";
import "dotenv/config";
const webServer=process.env.PLAYWRIGHT_EXISTING_SERVER?undefined:{command:"npm run start -- --hostname 127.0.0.1 --port 3100",url:"http://127.0.0.1:3100",reuseExistingServer:true,timeout:120_000,env:{...process.env,NEXT_PUBLIC_APP_URL:"http://127.0.0.1:3100",AUTH_URL:"http://127.0.0.1:3100",AUTH_GOOGLE_ID:"playwright-google-id",AUTH_GOOGLE_SECRET:"playwright-google-secret"}};
export default defineConfig({testDir:"./tests-e2e",fullyParallel:false,workers:1,retries:0,reporter:"line",timeout:30_000,use:{baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure"},webServer,projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}]});
