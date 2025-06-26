import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Visitors } from './collection';
import { Match } from 'meteor/check';
import axios from 'axios';
const { checkAndCreateVisitor } = require('visitor-npm-app');
import { extractTextFromImage } from '../googleVision';

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
   },

   async 'visitors.processOCR'(base64ImageData) {
    check(base64ImageData, String);

    
    const buffer = Buffer.from(base64ImageData.split(",")[1], 'base64');

    try {
      const extractedText = await extractTextFromImage(buffer);
      console.log('Extracted Text:', extractedText);
      return { text: extractedText };
    } catch (err) {
      console.error('Google Vision OCR failed:', err);
      throw new Meteor.Error('vision-ocr-failed', 'OCR failed: ' + err.message);
    }
  },

  // OCR Function With OZWELL

  async 'visitors.processOCR'(base64Image) {
    check(base64Image, String);

    const apiKey = Meteor.settings.ozwell.secretKey;

    try {
      const response = await axios.post(
        'https://api.ozwell.ai/ocr?utm_source=bluehive&utm_medium=chat&utm_campaign=bluehive-ai',
        {
          image: base64Image,
          documentType: 'id_card'
        },
        {
          headers: {
            'Authorization': `BHSK-sandbox-T5otgZ8z2T2AHZE_OiKVMNp2ullbgVD53tyGQwbi`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error("Ozwell OCR API failed:", error.message);
      throw new Meteor.Error('ozwell-ocr-failed', 'Could not process ID image');
    }
  }
  

});