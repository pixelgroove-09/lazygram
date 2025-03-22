# Lazygram - Instagram Automation Platform

Lazygram is a web application that helps users automate their Instagram content creation and posting workflow. It allows users to bulk upload images, generate AI-powered captions, and schedule posts to their Instagram business accounts.

## Features

- User authentication and account management
- Bulk image upload and management
- AI-generated captions and hashtags using Claude API
- Drag-and-drop scheduling interface
- Instagram business account integration
- Automated posting to Instagram

## Deployment Instructions

### Prerequisites

1. A Vercel account
2. A Supabase account
3. An Anthropic API key (for Claude AI)
4. An Instagram Business account connected to a Facebook Page

### Step 1: Set up Supabase

1. Create a new Supabase project
2. Enable the Auth service with email/password provider
3. Run the database schema script from `db/schema.sql` in the SQL Editor

### Step 2: Configure Environment Variables

Set up the following environment variables in your Vercel project:

