import { Mongo } from 'meteor/mongo';

// Define and export the Visitors MongoDB collection
export const Visitors = new Mongo.Collection('visitors');