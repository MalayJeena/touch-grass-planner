import { writeFileSync } from "node:fs";

const MODEL = "gemma3:4b";

async function getForecast(lat, lon) {
  // Free weather data from Open-Meteo, no API key needed. It will return null if offline or if the request fails.
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=auto&forecast_days=7`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) throw new Error("bad response");

    const d = (await res.json()).daily;

    return d.time.map(
      (day, i) =>
        `${day}: ${d.temperature_2m_min[i]} to ${d.temperature_2m_max[i]} C, rain ${d.precipitation_sum[i]} mm`,
    );
  } catch {
    return null;
  }
}

function buildPrompt(activity, forecast, notes) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weather = forecast
    ? forecast.join("\n")
    : "No forecast available (offline). Do not invent specific weather or dates. Give general seasonal advice and say it is not based on a live forecast.";
  return `You are a friendly outdoor planner. Today is ${today}.
The person wants to get outside for: ${activity}.
Their notes: ${notes || "none"}.

7-day weather:
${weather}

Write a short plan in Markdown:
1. The best 2 days/times to go out and why (use the weather).
2. A 5-item checklist of what to do or bring.
3. One small tip to enjoy it with the phone put away.
Keep it under 200 words.`;
}

async function askModel(prompt) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("Ollama not reachable. Is it running?");
  return (await res.json()).message.content;
}

async function main() {
  const [lat, lon, activity, notes = ""] = process.argv.slice(2);
  if (!lat || !lon || !activity) {
    console.log('Usage: node planner.js <lat> <lon> "<activity>" ["notes"]');
    process.exit(1);
  }

  const forecast = await getForecast(lat, lon);
  console.log(forecast ? "Forecast: live data from Open-Meteo" : "Forecast: OFFLINE fallback (no internet)");
  const plan = await askModel(buildPrompt(activity, forecast, notes));

  writeFileSync("todays_plan.md", plan, "utf-8");
  console.log(plan);
  console.log("\nSaved to todays_plan.md. Print it, then go outside!");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
