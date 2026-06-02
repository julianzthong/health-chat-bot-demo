# Rely Health — Care Navigator Demo (OpenAI / GPT-4o)

Same app as the Anthropic version, with GPT-4o as the backend model.
The only files that changed: `src/lib/openai.js` and the import in `src/hooks/useChat.js`.
Everything else — guardrails, prompt, components, hook logic — is identical.

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_OPENAI_API_KEY in .env  (https://platform.openai.com/api-keys)
npm run dev
```

## Project Structure

```
src/
├── lib/
│   ├── openai.js         # OpenAI API client (replaces anthropic.js)
│   └── guardrails.js     # Unchanged — parses [URGENT]/[SAFE] tags
├── hooks/
│   └── useChat.js        # Same logic, imports from openai.js instead
├── prompts/
│   └── careNavigator.js  # Unchanged — same system prompt works on both models
├── components/
│   ├── ChatMessage.jsx   # Unchanged
│   └── ChatMessage.module.css
├── App.jsx
└── App.css
```

## Anthropic vs OpenAI API differences

| | Anthropic | OpenAI |
|---|---|---|
| System prompt | Top-level `system` field | First message with `role: "system"` |
| Response text | `data.content[0].text` | `data.choices[0].message.content` |
| Auth header | `x-api-key` | `Authorization: Bearer ...` |
| Model string | `claude-sonnet-4-20250514` | `gpt-4o` |

## Production TODO
- [ ] Move API calls to a backend proxy to protect the API key
- [ ] Strip/anonymize PHI before sending to the API
- [ ] Log all conversations + guardrail flags (HIPAA audit trail)
- [ ] Add rate limiting per patient session
- [ ] Fallback if the model is unavailable

## Test Inputs

| Input | Expected |
|-------|----------|
| "I feel fine, just a little tired" | [SAFE] |
| "I have chest pain" | [URGENT] ER escalation |
| "My pain is an 8 out of 10" | [URGENT] ER escalation |
| "Redness around my incision" | [URGENT] infection flag |
| "I forgot my medication this morning" | [SAFE] gentle guidance |
