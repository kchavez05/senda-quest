# Senda Quest Requirements & Setup Guide

This document outlines the necessary tools, CLIs, and dependencies required to run, build, and deploy the Senda Quest application.

## Prerequisites

1. **Node.js** (v18.x or higher)
   - Ensure you have Node.js and npm installed.
   - [Download Node.js](https://nodejs.org/)

2. **Firebase CLI**
   - The Firebase Command Line Interface is required for deploying the database rules, hosting, and authenticating your local terminal to the project.
   - Install the Firebase CLI globally via npm so that the `firebase` command is recognized in your terminal:
     ```bash
     npm install -g firebase-tools
     ```
   - After installation, authenticate your local machine:
     ```bash
     firebase login
     ```

## Local Setup

1. **Install Project Dependencies**
   Run the following command in the root repository to install all packages, including the recently added `firebase-admin` dependencies:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Ensure your `.env.local` contains your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start the Application**
   Run the backend API and the Vite frontend simultaneously:
   ```bash
   npm run dev
   ```
