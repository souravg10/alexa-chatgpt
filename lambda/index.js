const Alexa = require('ask-sdk-core');
const OpenAI = require('openai');

const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const MAX_SPOKEN_CHARS = 700;

function sanitizeForSpeech(text) {
  return String(text || '')
    .replace(/&/g, 'and')
    .replace(/</g, ' less than ')
    .replace(/>/g, ' greater than ')
    .replace(/[\*_#`~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimForSpeech(text) {
  if (text.length <= MAX_SPOKEN_CHARS) return text;
  return `${text.slice(0, MAX_SPOKEN_CHARS).trim()}...`;
}

async function askOpenAI(userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              'You are a helpful Alexa voice assistant. Keep answers accurate, concise, natural, and easy to listen to. Prefer 2 to 5 sentences unless the user asks for more detail. Avoid markdown, bullet points, and long lists.'
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: userPrompt
          }
        ]
      }
    ]
  });

  const outputText = response.output_text || 'Sorry, I could not generate a response.';
  return trimForSpeech(sanitizeForSpeech(outputText));
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to ChatGPT Assistant. You can say, ask chat assistant, what is black hole?';
    return handlerInput.responseBuilder
      .speak(speechText)
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
        .speak('I did not catch your question. Please try again by saying, ask chat assistant, followed by your question.')
        .reprompt('What would you like to ask?')
        .getResponse();
    }

    try {
      const answer = await askOpenAI(question);
      return handlerInput.responseBuilder
        .speak(answer)
        .reprompt('You can ask another question if you want.')
        .getResponse();
    } catch (error) {
      console.error('OpenAI request failed:', error);
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble reaching the AI service just now. Please check your OpenAI API key and try again.')
        .getResponse();
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Ask me anything by saying, ask chat assistant, then your question.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('What would you like to ask?')
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye.')
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
      .speak('Sorry, I did not understand that. Try saying, ask chat assistant, what is a neutron star?')
      .reprompt('What would you like to ask?')
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
      .speak(`You just triggered ${intentName}.`)
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`Error handled: ${error.stack}`);
    return handlerInput.responseBuilder
      .speak('Sorry, something went wrong.')
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
