/**
* This file shows how to implemente the code to handle the slash command, in this case /auto-delete
* It also includes the 2 oauth authentication steps
  - for slack to obtain the token for posting and deleting message
  - for github to obtain the access to external service if needed
**/
const { createServer } = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { createEventAdapter } = require("@slack/events-api");
const { WebClient } = require("@slack/web-api");
const app = express();
const port = process.env.PORT || 3000;
const server = createServer(app);

//Get Client ID and secrect from slack
const clientID_SLACK = process.env.CLIENT_ID_SLACK;
const clientSecret_SLACK = process.env.CLIENT_SECRET_SLACK;

//Get Client ID and secrect from Github
const clientID_GITHUB = process.env.CLIENT_ID_GITHUB;
const clientSecret_GITHUB = process.env.CLIENT_SECRET_GITHUB;

let web;

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

//Oauth endpoint for slack, after successfully authenticated with slack
//Redirect to github page to do the authentication for github
app.get("/oauth", (req, res, next) => {
  const code = req.query.code;

  //call slack oauth API
  axios({
    method: 'get',
    url: `https://slack.com/api/oauth.access?client_id=${clientID_SLACK}&client_secret=${clientSecret_SLACK}&code=${code}&redirect_uri=https://0903b223.ngrok.io/oauth`,
    headers: {
         accept: 'application/json'
    }
  }).then((response) => {
    // Once we get the response, extract the access token from
    // the response body to initialize the webClient for sending message
    web = new WebClient(response.data.bot.bot_access_token);
    //Redirect the user to index_github to authenticate the Github Oauth
    res.redirect(`/index_github.html`);
  })
});

//Oauth endpoint for github, after successfully authenticated with github
//Redirect the user back to slack
app.get('/oauth/github', (req, res) => {
  // The req.query object has the query params that
  // were sent to this route. We want the `code` param
  const requestToken = req.query.code
  axios({
    method: 'post',
    url: `https://github.com/login/oauth/access_token?client_id=${clientID_GITHUB}&client_secret=${clientSecret_GITHUB}&code=${requestToken}`,
    headers: {
         accept: 'application/json'
    }
  }).then((response) => {
    //The Response should contain the access_token for current user to github
    res.redirect("https://XXXXX.slack.com")
  })
})

app.post("/auto-delete", (req, res, next) => {
  //Response to the command "/auto-delete help"
  if (req.body.text === "help") {
    res.json({
       response_type: "ephemeral",
       text: "How to use /auto-delete",
       attachments:[
           {
              "text":"Use command `/auto-delete {time_in_second} {message}`, e.g. `/auto-delete 10 Message will be deleted in 10s`, to post the message and be automatically deleted in specified seconds."
           }
       ]
    });
  } else {
    //Handle the message
    //Get the channel id of the event
    const channel = req.body.channel_id;
    const textArray = req.body.text.split(" ");
    //Get the TTL for the message
    const ttl = parseInt(textArray[0]) * 1000;
    textArray.shift();
    //Construct the message
    const newM = `Message from \`${req.body.user_name}\`. Delete in \`${ttl/1000}\` seconds. \n${textArray.join(" ")}`;
    //Post the message
    web.chat.postMessage({
      channel,
      text: newM,
      response_type: "ephemeral"
    }).then(message => {
      //Delete the message after TTL
      setTimeout(() => {
        web.chat.delete({
          channel: channel,
          ts: message.ts
        });
      }, ttl);
    });
    res.json("Message received and is processing....");
  }
});

app.use(express.static(__dirname + '/public'));

server.listen(port, () => {
  console.log(`Listening for events on ${server.address().port}`);
});