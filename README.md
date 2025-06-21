visitor-badgemate-app — Smart Visitor Check-in System

A modern, AI-powered visitor management system built with Meteor.js. It allows seamless visitor check-ins using webcam ID scanning (Google Vision OCR), facial recognition (Ozwell.ai), and CRM integration (HubSpot), with support for badge printing and real-time validation through a custom NPM library.

#Features

- Smart Check-In Form – Simple UI with real-time validation

- Webcam ID OCR – Uses Google Vision API to extract visitor data from camera captures

- Facial Recognition (Ozwell.ai) – Optional facial scan for enhanced verification

- Badge Printing Support – Instant badge generation for registered visitors

- Duplicate Prevention – Validates repeat entries via visitor-npm-app

- FHIR Compatibility – Data will be taken with the guidelines of FHIR Patient schema

- HubSpot Sync (Planned) – Auto-sync visitor records into CRM

#Tech Stack

Meteor.js – Full-stack JavaScript framework

React.js – Frontend component-based UI

MongoDB – Visitor data storage

Google Vision OCR – Text recognition from ID captures

Ozwell.ai (planned) – Face detection and validation

AJV & FHIR Patient – Schema validation via visitor-npm-app

Node.js NPM Package – Shared logic between multiple 

#NPM Integration:

This project uses a custom NPM package for visitor validation and schema handling with the command:
npm install visitor-npm-app
https://github.com/BosuBose132/visitor-npm-app-package

#Google Vision OCR Setup
To use Google Vision OCR:

-Create a service account at Google Cloud Console

-Enable Vision API

-Download and store the service key JSON file in the server-side private/ folder

-Set up authentication in googlevision.js

#Meteor Methods (You can find this in Methods.js)
visitors.checkIn: Validates and stores visitor info

visitors.processOCR: Accepts base64 image input and extracts text via Google Vision OCR

#How to Run Locally
 Its a complete meteor based applicationwhere you can run locally with the following simple commands,

git clone https://github.com/BosuBose132/visitor-badgemate-app.git
cd visitor-badgemate-app
meteor npm install
meteor

Make sure you install the visitor-npm-app package.

Author:

Bosu Babu Bade

