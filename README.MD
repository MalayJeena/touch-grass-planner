# Touch Grass Planner

A tiny local-AI outdoor planner. It fetches the 7-day forecast and uses an
open-weight model (Gemma via Ollama) to suggest when and how to get outside.
It still works with no internet, falling back to general seasonal advice.

## Requirements
- Node.js 18+
- [Ollama](https://ollama.com) with a Gemma model: `ollama pull gemma3:4b`

## Run it
node planner.js <lat> <lon> "activity" "notes"

Example:
node planner.js 43.2 54.5 "inspecting insects" "flower pots"

The plan is printed and saved to `todays_plan.md`.

## How it works
1. Fetches the forecast from Open-Meteo (no API key).
2. Builds a prompt from the date, activity, notes and forecast.
3. Sends it to Gemma on `localhost:11434`. Nothing leaves your machine.
4. If the forecast fails (offline), it says so and gives general advice.

## Credits
Built for the Hacktoberfest Open-Source AI Challenge, Week 1: Touch Grass.
Weather data from [Open-Meteo](https://open-meteo.com).
