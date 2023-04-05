# Slackpaste

This tool arose because the company I work for doesn't retain slack messages over a certain time window, but does allow for saving slack threads in Notion.

However, when copying from slack and pasting into Notion, threads get junked up with large, 800px square images of every avatar and emoji. There are other minor problems too. 

Slackpaste seeks to address these issues by stripping out unnecessary images and making it easy to copy from Slack and paste into Notion.

## Usage

1. Copy an entire slack thread to the clipboard
2. Paste it into the Slackpaste window
3. Copy the formatted output, either via the Copy Button or manually.
4. Paste into Notion or wherever else.

## Running Locally

This is built off of Create-React-App and has many of the commands you'd find familiar.

1. Clone this repo
2. `cd slackpaste && npm install`
3. `npm start`
