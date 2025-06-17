import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Visitors } from './collection';
import { Match } from 'meteor/check';

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

    // Convert base64 image string to Buffer (remove the prefix data:image/png;base64,)
    const buffer = Buffer.from(base64ImageData.split(",")[1], 'base64');

    try {
      const extractedText = await extractTextFromImage(buffer);
      console.log('Extracted Text:', extractedText);
      return { text: extractedText };
    } catch (err) {
      console.error('Google Vision OCR failed:', err);
      throw new Meteor.Error('vision-ocr-failed', 'OCR failed: ' + err.message);
    }
  }
  
});