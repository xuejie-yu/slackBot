/**
* This file shows how to extract the channels in the slack space and send message to the channel "general"
**/

const { WebClient } = require("@slack/web-api");

const web = new WebClient(process.env.SLACK_TOKEN);

console.log("Getting started with Node Slack SDK");

const currentTime = new Date().toTimeString();

(async () => {
  let message;
  let channels;
  let general_channel;
  try {
    //Get all channels
    channels = await web.conversations.list();
    console.log(`Channels: ${JSON.stringify(channels)}`);
    //Find the channel named "general"
    general_channel = channels.channels.find(channel => channel.name === "general").id;
    console.log(`General: ${general_channel}`);
    //Send a message to channel #general
    message = await web.chat.postMessage({
      channel: general_channel,
      text: `Current Time is ${currentTime}`
    });
    console.log(message);
  } catch(err) {
    console.log(err);
  }
  //Delete the message posted above
  setTimeout(async () => {
    await web.chat.delete({
      channel: general_channel,
      ts: message.ts
    });
  }, 5000);
  console.log("message posted!. It will be deleted after 5 secs");
})();