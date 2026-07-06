// Local dev listener: run `node dev/ingest-listener.mjs`, set the module's
// Ingest URL to http://localhost:9000, roll in Foundry, watch payloads print.
// Answers CORS preflight so browsers allow the cross-origin POST.
import { createServer } from "node:http";

const PORT = 9000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    console.log(`\n=== ${new Date().toISOString()} ${req.method} ===`);
    console.log("Authorization:", req.headers.authorization ?? "(none)");
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body);
    }
    res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
    res.end('{"ok":true}');
  });
}).listen(PORT, () => console.log(`ingest listener on http://localhost:${PORT}`));
