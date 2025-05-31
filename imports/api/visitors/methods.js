import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Visitors } from './collection';
import { checkAndCreateVisitor } from 'visitor-npm-app'; // from your custom NPM package

Meteor.methods({
  'visitors.checkIn'(data) {
    check(data, {
      name: String,
      company: String,
      email: String,
      purpose: String
    });

    // Uses your custom logic to validate and insert
    return checkAndCreateVisitor(data, Visitors);
  }
});