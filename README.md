# Rely Health — Care Navigator Demo (Ollama / Local)

Same app as the Anthropic version, running entirely on your local machine.
No API key. No cost. No data leaves your computer.

## Step 1 — Install Ollama

**Mac:**
```bash
brew install ollama
```
Or download the installer from https://ollama.com/download

**Windows:**
Download and run the installer from https://ollama.com/download

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify it installed:
```bash
ollama --version
```

---

## Step 2 — Pull a model

This downloads the model to your machine (~2GB for llama3.2):
```bash
ollama pull llama3.2
```

Other good options (pick one):
```bash
ollama pull mistral       # great at following instructions
ollama pull llama3.1:8b   # larger, better reasoning (~5GB)
ollama pull gemma2        # Google's open model, very capable
```

See everything you've downloaded:
```bash
ollama list
```

---

## Step 3 — Start Ollama with CORS enabled

The browser (running on port 5173) needs permission to talk to Ollama (port 11434).
You need to set the OLLAMA_ORIGINS environment variable when starting Ollama.

**Mac/Linux:**
```bash
OLLAMA_ORIGINS=http://localhost:5173 ollama serve
```

**Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS=http://localhost:5173 && ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="http://localhost:5173"; ollama serve
```

Leave this terminal open — Ollama needs to keep running.

---

## Step 4 — Run the app

In a new terminal:
```bash
cd rely-health-demo-ollama
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Changing the model

Open `src/lib/ollama.js` and update the MODEL constant:
```js
const MODEL = "llama3.2"; // change to any model from `ollama list`
```

---

## Project Structure

```
src/
├── lib/
│   ├── ollama.js         # Active client — runs locally, no key needed
│   ├── anthropic.js      # Reference — swap import in useChat.js to use
│   ├── openai.js         # Reference — swap import in useChat.js to use
│   └── guardrails.js     # Parses [URGENT]/[SAFE] tags (shared by all clients)
├── hooks/
│   └── useChat.js        # Imports from ollama.js — change this to swap providers
├── prompts/
│   └── careNavigator.js  # System prompt — works across all three providers
├── components/
│   ├── ChatMessage.jsx
│   └── ChatMessage.module.css
├── App.jsx
└── App.css
```

## Switching providers

To use Anthropic or OpenAI instead, just change one line in `src/hooks/useChat.js`:

```js
// Current (Ollama)
import { sendMessage } from "../lib/ollama";

// Switch to Anthropic
import { sendMessage } from "../lib/anthropic";

// Switch to OpenAI
import { sendMessage } from "../lib/openai";
```

Then make sure the relevant key is set in your `.env` file.

---

## Anthropic vs OpenAI vs Ollama comparison

| | Anthropic | OpenAI | Ollama |
|---|---|---|---|
| Cost | Pay per token | Pay per token | Free |
| API key | Yes | Yes | No |
| System prompt | Top-level `system` field | First message `role: "system"` | First message `role: "system"` |
| Response path | `data.content[0].text` | `data.choices[0].message.content` | `data.message.content` |
| Base URL | api.anthropic.com | api.openai.com | localhost:11434 |
| Data privacy | Sent to Anthropic | Sent to OpenAI | Stays on your machine |

---

## Troubleshooting

**"Failed to fetch" error in the browser**
Ollama isn't running, or it's running without CORS enabled.
Stop it and restart with: `OLLAMA_ORIGINS=http://localhost:5173 ollama serve`

**Responses are slow**
Totally normal for local models, especially on first run (the model loads into memory).
llama3.2 is the fastest option for most machines.

**Model not found error**
Run `ollama list` to see installed models, then update MODEL in `src/lib/ollama.js`.

---

## Test Inputs

| Input | Expected |
|-------|----------|
| "I feel fine, just a little tired" | [SAFE] |
| "I have chest pain" | [URGENT] ER escalation |
| "My pain is an 8 out of 10" | [URGENT] ER escalation |
| "Redness around my incision" | [URGENT] infection flag |
| "I forgot my medication this morning" | [SAFE] gentle guidance |

Note: Local models are generally less reliable at following structured output formats
like [URGENT]/[SAFE] compared to Claude or GPT-4o. If the guardrail badge doesn't
appear, that's expected — it's a good thing to bring up in the interview when
discussing why model choice matters in production clinical systems.
