import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Visitors } from './collection';
import { Match } from 'meteor/check';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: Meteor.settings.openai.apiKey,
});
const openaiApiKey = Meteor.settings?.openai?.apiKey;
if (!openaiApiKey) {
  console.error('Missing OpenAI API key in Meteor settings!');
}

const { checkAndCreateVisitor } = require('visitor-npm-app');
//import { extractTextFromImage } from '../googleVision';

Meteor.methods({
  async 'visitors.checkIn'(data) {
    console.log("Visitors has findOneAsync?", typeof Visitors.findOneAsync);
    check(data, {
      name: String,
      company: String,
      email: String,
      purpose: String,
       phone: String,
  dob: Match.Optional(String),
  gender: Match.Optional(String)
    
    });

    return await checkAndCreateVisitor(data, Visitors);
   }
   ,

  //  async 'visitors.processOCR'(base64ImageData) {
  //   check(base64ImageData, String);

    
  //   const buffer = Buffer.from(base64ImageData.split(",")[1], 'base64');

  //   try {
  //     const extractedText = await extractTextFromImage(buffer);
  //     console.log('Extracted Text:', extractedText);
  //     return { text: extractedText };
  //   } catch (err) {
  //     console.error('Google Vision OCR failed:', err);
  //     throw new Meteor.Error('vision-ocr-failed', 'OCR failed: ' + err.message);
  //   }
  // },
  
  async 'visitors.processOCRWithOpenAI'(base64ImageData) {
    check(base64ImageData, String);

    if (!openaiApiKey) {
    throw new Meteor.Error('config-error', 'OpenAI API key is not configured on the server.');
    }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an OCR assistant. Extract the visitor information from an ID card image in structured JSON.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the following fields: name, email, phone, company, DOB. Return them as JSON.' },
            { type: 'image_url', image_url: { url: base64ImageData, detail: 'auto' } }
          ]
        }
      ]
    });

    const answer = response.choices[0].message.content;
    console.log('OpenAI OCR result:', answer);

    return { text: answer };
  } catch (err) {
    console.error('OpenAI OCR failed:', err);
    throw new Meteor.Error('openai-ocr-failed', 'OpenAI OCR failed: ' + err.message);
  }
  }
});