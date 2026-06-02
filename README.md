# Rely Health — Care Navigator Demo

A post-discharge patient care navigator chatbot built with React + the Anthropic API.
Built as interview prep demonstrating AI-powered clinical workflows.

## Project Structure

```
src/
├── lib/
│   ├── anthropic.js      # API client (swap for a backend proxy in prod)
│   └── guardrails.js     # Parses [URGENT]/[SAFE] tags from Claude responses
├── hooks/
│   └── useChat.js        # All chat state + API logic in one custom hook
├── prompts/
│   └── careNavigator.js  # System prompt with escalation rules
├── components/
│   ├── ChatMessage.jsx   # Message bubble with guardrail badge
│   └── ChatMessage.module.css
├── App.jsx
└── App.css
```

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_ANTHROPIC_API_KEY in .env
npm run dev
```

## Key Concepts

### Guardrail Pattern
Claude is instructed via the system prompt to prefix every response with [URGENT] or [SAFE].
guardrails.js parses this tag and strips it before display.
In production you'd log every [URGENT] to a DB and alert a care coordinator.

### Conversation History
The API is stateless — you send the full history on every request.
useChat.js maintains historyRef (raw API format) separately from messages (UI format).

### Prompt Engineering
The system prompt in src/prompts/careNavigator.js:
- Defines role and scope (navigator, not doctor)
- Enumerates escalation triggers explicitly
- Enforces structured output format for reliable parsing
- Constrains response length for clinical context

### Production TODO
- [ ] Move API calls to a backend proxy (Rails: POST /api/chat)
- [ ] Strip/anonymize PHI before sending to the API
- [ ] Log all conversations + guardrail flags (HIPAA audit trail)
- [ ] Add rate limiting per patient session
- [ ] Fallback if Claude is unavailable

## Test Inputs

| Input | Expected |
|-------|----------|
| "I feel fine, just a little tired" | [SAFE] |
| "I have chest pain" | [URGENT] ER escalation |
| "My pain is an 8 out of 10" | [URGENT] ER escalation |
| "Redness around my incision" | [URGENT] infection flag |
| "I forgot my medication this morning" | [SAFE] gentle guidance |
