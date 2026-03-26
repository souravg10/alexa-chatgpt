# Alexa-Hosted Node.js skill repo for ChatGPT integration

This guide gives you the exact minimum repository structure and starter code you can put in a **public GitHub repo** and import into the **Alexa Developer Console** as an **Alexa-Hosted (Node.js)** skill.

It is designed for this flow:

1. Create Skill
2. Choose **Custom**
3. Choose **Alexa-Hosted (Node.js)**
4. Click **Import skill**
5. Paste your public GitHub `.git` repo link

---

## 1) Required repo structure

Create your GitHub repo with this exact structure:

```text
my-alexa-chatgpt-skill/
├── lambda/
│   ├── index.js
│   └── package.json
└── skill-package/
    ├── interactionModels/
    │   └── custom/
    │       └── en-US.json
    └── skill.json
```

This is the safest structure for an imported Alexa-hosted Node.js skill.

---

## 2) What each file does

- `lambda/index.js` → your Alexa request handlers and ChatGPT/OpenAI call
- `lambda/package.json` → Node.js dependencies
- `skill-package/interactionModels/custom/en-US.json` → invocation name, intents, and utterances
- `skill-package/skill.json` → skill manifest metadata

---

## 3) `lambda/package.json`

Create `lambda/package.json` with this content:

```json
{
  "name": "alexa-chatgpt-skill",
  "version": "1.0.0",
  "description": "Alexa hosted custom skill that calls OpenAI",
  "main": "index.js",
  "license": "MIT",
  "dependencies": {
    "ask-sdk-core": "^2.14.0",
    "openai": "^5.0.0"
  }
}
```

---

## 4) `lambda/index.js`

Create `lambda/index.js` with this content:

```javascript
const Alexa = require('ask-sdk-core');
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getChatGPTResponse(userText) {
  if (!process.env.OPENAI_API_KEY) {
    return 'Your OpenAI API key is not configured yet. Please add OPENAI_API_KEY as an environment variable before testing.';
  }

  try {
    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are a concise and helpful voice assistant inside Alexa. Keep answers short, natural, and easy to speak aloud. Avoid markdown, bullet points, URLs, and long lists.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userText
            }
          ]
        }
      ],
      max_output_tokens: 180
    });

    const text = response.output_text?.trim();
    return text || 'Sorry, I could not generate a response right now.';
  } catch (error) {
    console.error('OpenAI error:', error);
    return 'Sorry, I had trouble reaching the AI service.';
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome to Chat Helper. Ask me anything by saying, ask chat helper followed by your question.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('What would you like to ask?')
      .getResponse();
  }
};

const AskChatGPTIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskChatGPTIntent';
  },
  async handle(handlerInput) {
    const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');

    if (!question) {
      return handlerInput.responseBuilder
        .speak('I did not catch your question. Please try again.')
        .reprompt('You can ask me something like, what is black hole theory?')
        .getResponse();
    }

    const answer = await getChatGPTResponse(question);

    return handlerInput.responseBuilder
      .speak(answer)
      .reprompt('You can ask another question if you want.')
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Ask me anything by saying, ask chat helper, then your question.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
      );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  }
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry, I did not understand that. Ask me a direct question.')
      .reprompt('Try asking me a question.')
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    return handlerInput.responseBuilder
      .speak(`You just triggered ${intentName}`)
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`Error handled: ${JSON.stringify(error)}`);
    return handlerInput.responseBuilder
      .speak('Sorry, there was a problem handling your request.')
      .reprompt('Please try again.')
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AskChatGPTIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
```

---

## 5) `skill-package/interactionModels/custom/en-US.json`

Create `skill-package/interactionModels/custom/en-US.json` with this content:

```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "chat helper",
      "intents": [
        {
          "name": "AskChatGPTIntent",
          "slots": [
            {
              "name": "question",
              "type": "AMAZON.SearchQuery"
            }
          ],
          "samples": [
            "ask {question}",
            "question {question}",
            "tell me {question}",
            "what is {question}",
            "who is {question}",
            "explain {question}"
          ]
        },
        {
          "name": "AMAZON.CancelIntent",
          "samples": []
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": []
        },
        {
          "name": "AMAZON.StopIntent",
          "samples": []
        },
        {
          "name": "AMAZON.NavigateHomeIntent",
          "samples": []
        },
        {
          "name": "AMAZON.FallbackIntent",
          "samples": []
        }
      ],
      "types": []
    }
  }
}
```

---

## 6) `skill-package/skill.json`

Create `skill-package/skill.json` with this content:

```json
{
  "manifest": {
    "publishingInformation": {
      "locales": {
        "en-US": {
          "name": "Chat Helper",
          "summary": "Ask questions and get AI generated answers.",
          "description": "A custom Alexa skill that sends a user's question to an AI backend and speaks the response.",
          "examplePhrases": [
            "Alexa, open chat helper",
            "Alexa, ask chat helper what is artificial intelligence",
            "Alexa, ask chat helper explain black holes"
          ]
        }
      },
      "isAvailableWorldwide": true,
      "testingInstructions": "Open the skill and ask any question.",
      "category": "KNOWLEDGE_AND_TRIVIA",
      "distributionMode": "PUBLIC"
    },
    "apis": {
      "custom": {}
    },
    "manifestVersion": "1.0"
  }
}
```

---

## 7) How to push this repo to GitHub

From your local machine:

```bash
git init
git add .
git commit -m "Initial Alexa hosted ChatGPT skill"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Then make sure the repo is public.

Use the repo's `.git` URL in Alexa Developer Console.

Example:

```text
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

---

## 8) After import in Alexa Developer Console

After Alexa imports the repo:

1. Open the skill.
2. Go to **Build** and confirm the interaction model imported correctly.
3. Go to **Code** and verify your files are there.
4. Add the environment variable `OPENAI_API_KEY`.
5. Save and deploy.
6. Build the interaction model if needed.
7. Test in the Alexa simulator.

---

## 9) Important note about environment variables

Your code uses:

```text
process.env.OPENAI_API_KEY
```

So do not hardcode your API key inside `index.js`.

Store it as an environment variable in the hosted skill configuration.

---

## 10) Example test phrases

Try these in the Alexa simulator:

```text
Alexa, open chat helper
Alexa, ask chat helper what is machine learning
Alexa, ask chat helper explain why the sky is blue
Alexa, ask chat helper who was Albert Einstein
```

---

## 11) Common issues

### Repo import fails
Check these first:

- the repo is public
- you pasted the `.git` URL
- the repo is under 50 MB
- `lambda/index.js` exists
- `skill-package/skill.json` exists
- `skill-package/interactionModels/custom/en-US.json` exists

### Skill opens but answer fails
Check these:

- `OPENAI_API_KEY` is configured
- deployment completed successfully
- package install succeeded
- your OpenAI project has API access and billing configured

### Alexa says it cannot understand the request
Check these:

- invocation name is valid
- sample utterances are built
- model build completed successfully

---

## 12) Best next improvement

Once the basic version works, the next thing to improve is session awareness.

That means you can store prior turns in session attributes and send the last few turns to OpenAI so Alexa feels more conversational instead of stateless.

---

## 13) Minimum files checklist

You need all of these at minimum:

```text
lambda/index.js
lambda/package.json
skill-package/interactionModels/custom/en-US.json
skill-package/skill.json
```

---

## 14) Final recommendation

For your use case, start with this exact minimal repo first.
Do not add account linking, persistence, authentication layers, or fancy intent routing yet.
First get this flow working end to end:

- Alexa hears the question
- your intent receives the question
- your Lambda calls OpenAI
- Alexa speaks back the answer

After that, you can improve latency, safety, session memory, and prompt design.
