# Alexa ChatGPT Skill Starter

This repository follows Amazon's **Alexa-hosted skill package format for Node.js**.

## Folder structure

- `lambda/index.js`
- `lambda/package.json`
- `skill-package/interactionModels/custom/en-US.json`
- `skill-package/skill.json`

## What this starter does

- Creates a custom Alexa skill with invocation name **chat assistant**
- Sends the user's spoken question to OpenAI
- Speaks back a short answer suitable for voice

## Before testing

In the Alexa Developer Console, after you import this repo:

1. Open **Code** for the hosted Lambda.
2. Add environment variables:
   - `OPENAI_API_KEY` = your real OpenAI API key
   - `OPENAI_MODEL` = optional, for example `gpt-5-mini`
3. Save and deploy.
4. Build the interaction model.
5. Test in the Alexa simulator.

## Example phrases

- "Alexa, open chat assistant"
- "Alexa, ask chat assistant what is a black hole"
- "Alexa, ask chat assistant explain cloud computing"

## Notes

- Replace the placeholder privacy policy and terms URLs in `skill-package/skill.json` before publishing.
- If Alexa-hosted import complains about the manifest endpoint, re-save the endpoint from the Developer Console after import.
- Keep answers short because long responses are not pleasant in voice.
