import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Visitors } from './collection';
const { checkAndCreateVisitor } = require('visitor-npm-app');

Meteor.methods({
  async 'visitors.checkIn'(data) {
    console.log("Visitors has findOneAsync?", typeof Visitors.findOneAsync);
    check(data, {
      name: String,
      company: String,
      email: String,
      purpose: String,
    });

    return await checkAndCreateVisitor(data, Visitors);
    

  }
  
});