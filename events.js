
/**
* This file shows how to listen to the event of "app_mention", namely @bot, and repeat the message of the author
**/

const { createEventAdapter } = require("@slack/events-api");
const { WebClient } = require("@slack/web-api");
const web = new WebClient(process.env.SLACK_TOKEN);
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEvents = createEventAdapter(slackSigningSecret);
const port = process.env.PORT || 3000;


slackEvents.on("app_mention", (event) => {
  //get event source channel
  const channel = event.channel;
  //get the text posted with the 
  const text = event.text.split(" ");
  text.shift();
  //Just post what the message send without @
  const newM = text.join(" ");
  web.chat.postMessage({
    channel,
    text: newM
  });
});

slackEvents
  .start(port)
  .then(server => {
    console.log(`Listening for events on ${server.address().port}`);
  });
