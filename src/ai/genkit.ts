import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The model to use.
      // See https://developers.generativeai.google/models/gemini
      model: 'gemini-1.5-flash',
    }),
  ],
});
