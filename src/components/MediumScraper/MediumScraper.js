import React, { Component } from "react";
import { connect } from "react-redux";
import Firebase from "../../firebase/firebase.js";
import { withRouter } from 'react-router-dom';  // Importing withRouter for routing

import "./MediumScraper.css";

class ConnectedMediumScraper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://notnotnotnotyn.medium.com/the-technicalities-of-a-time-traveling-device-b02906d784b9',
      jsonOfLife: null,
      isLoading: false,
      error: null,
      allowDuplicateScraping: false,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.fetchHtmlAndSendToChatGPT = this.fetchHtmlAndSendToChatGPT.bind(this);
    this.waitForPageContent = this.waitForPageContent.bind(this);
    this.sendToSweducerWorkstation = this.sendToSweducerWorkstation.bind(this);
  }

  componentDidMount() {
    console.log("MediumScraper mounted");
  }

  handleInputChange(e) {
    this.setState({ url: e.target.value });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForPageContent(url) {
    const renderEndpoint = `http://localhost:3001/render?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(renderEndpoint);

      const data = await response.json();

      return data.tweets;
    } catch (err) {
      console.error("waitForPageContent failed:", err);
      return null;
    }
  }

  async recursiveFetch(url, visited = new Set()) {

    return scrappedmedium;

    const { allowDuplicateScraping } = this.state;

    if (!allowDuplicateScraping && visited.has(url)) {
      return null;
    }

    visited.add(url);

    try {
      const extractedContent = await this.waitForPageContent(url);

      if (!extractedContent) return null;

      const openAIAPI = await Firebase.getOpenAIAPI();
      const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });

      console.log("extractedContent", extractedContent);

      const payload = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a brilliant parser. Your job is to return only 
                      and exactly the following JSON structure. Do not 
                      explain anything. Do not include any extra commentary. 
                      Just return a JSON object with two top-level keys: 
                      'tweets' and 'mediumPosts' in the correct order from 
                      top to bottom. Each tweet contains a 'text' and an 
                      array of 'hashtags'. Each Medium post contains a 
                      'title', 'href', and an array of 'tags'. 

                      Make sure each href is an absolute Medium.com URL. 
                      That means the href should be: 'https://notnotnotnotyn.medium.com/' + 
                      the relative href from the HTML source (e.g. /my-article-id123). 

                      Return only a JSON that strictly matches the following format:
                      {
                        "tweets": [
                          {
                            "text": "string",
                            "hashtags": ["tag"]
                          }
                        ],
                        "mediumPosts": [
                          {
                            "title": "string",
                            "href": "https://notnotnotnotyn.medium.com/string",
                            "tags": ["tag"]
                          }
                        ]
                      }`
          },
          {
            role: "user",
            content: `Extract the tweets and Medium links from the following 
                      HTML snippet. Follow the above JSON format strictly.
                      ${extractedContent}`,
          },
        ],
        temperature: 0.2,
      };

      const gptResponse = await openai.chat.completions.create(payload);
      const aiResponse = gptResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(aiResponse);

      let allTweets = parsed.tweets || [];
      let allMediumPosts = [];

      for (let post of parsed.mediumPosts || []) {
        const nestedResult = await this.recursiveFetch(post.href, visited);
        await this.delay(4000);

        allMediumPosts.push({
          ...post,
          children: nestedResult ? nestedResult.mediumPosts : [],
        });

        allTweets = allTweets.concat(nestedResult?.tweets || []);
      }

      return { tweets: allTweets, mediumPosts: allMediumPosts };
    } catch (err) {
      console.error("Recursive fetch error:", err);
      return null;
    }
  }

  async fetchHtmlAndSendToChatGPT() {
    const { url } = this.state;

    if (!url.startsWith("http")) {
      this.setState({ error: "Please enter a valid URL." });
      return;
    }

    this.setState({ isLoading: true, error: null });

    const result = await this.recursiveFetch(url);
    if (result) {
      this.setState({ jsonOfLife: JSON.stringify(result, null, 2), isLoading: false });
    } else {
      this.setState({ error: "Failed to extract JSON structure.", isLoading: false });
    }
  }

  // Function to send data to Sweducer Workstation (navigating to the next view)
  sendToSweducerWorkstation() {
    const { jsonOfLife } = this.state;

    if (!jsonOfLife) {
      this.setState({ error: "No JSON data to send!" });
      return;
    }

    // Instead of using axios, navigate to the Sweducer Workstation and pass jsonOfLife as state
    this.props.history.push({
      pathname: `/sweducerworkstation`,
      state: { jsonOfLife: JSON.parse(jsonOfLife) }, // Pass jsonOfLife as state
    });
  }

  render() {
    const { url, jsonOfLife, isLoading, error, allowDuplicateScraping } = this.state;

    return (
      <div className="MediumScraper-container l-container">
        <h2>Medium to SAFE JSON Extractor</h2>

        <input
          type="text"
          value={url}
          onChange={this.handleInputChange}
          placeholder="Enter Medium article URL"
          className="MediumScraper-input"
        />

        <label>
          <input
            type="checkbox"
            checked={allowDuplicateScraping}
            onChange={() => this.setState({ allowDuplicateScraping: !allowDuplicateScraping })}
          />
          Allow Duplicate Scraping
        </label>

        <button onClick={this.fetchHtmlAndSendToChatGPT} disabled={isLoading} className="MediumScraper-button">
          {isLoading ? "Generating..." : "Extract SAFE Tree"}
        </button>

        {jsonOfLife && (
          <div className="MediumScraper-results">
            <h3>JSON of Life:</h3>
            <pre>{jsonOfLife}</pre>
          </div>
        )}

        {jsonOfLife && (
          <button
            onClick={this.sendToSweducerWorkstation}
            className="MediumScraper-button"
          >
            Send to Sweducer Workstation
          </button>
        )}

        {error && <div className="MediumScraper-error">{error}</div>}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let MediumScraper = withRouter(connect(mapStateToProps)(ConnectedMediumScraper));
export default withRouter(MediumScraper);


const scrappedmedium = {
  "tweets": [
    {
      "text": "- ayam a user and this is my story-- hi, user",
      "hashtags": [
        "ttb",
        "abeokutakodes"
      ]
    },
    {
      "text": "- i miss it already #humanity",
      "hashtags": []
    },
    {
      "text": "- no no- daz y e no work- i think the correct thing is- #nnb.deploy(earth)- #abeokutakodes",
      "hashtags": [
        "nnb",
        "abeokutakodes"
      ]
    },
    {
      "text": "- it's a giant giant pawafool device #nnb",
      "hashtags": [
        "nnb"
      ]
    },
    {
      "text": "- tolani, cover your brezz nau. wayayu embarrassing - us",
      "hashtags": [
        "yorubbbygehinny"
      ]
    },
    {
      "text": "- eez visual, but it responds to you- yuwa in control of your own world#textyng #abeokutakodes",
      "hashtags": [
        "textyng",
        "abeokutakodes"
      ]
    },
    {
      "text": "- #juniorgirls",
      "hashtags": []
    },
    {
      "text": "- test me bby- test me!- oohh yeess- daddy#seniorgehs",
      "hashtags": [
        "seniorgehs"
      ]
    },
    {
      "text": "- #time is the answer - every bit of it#thryd#abeokutakodes",
      "hashtags": [
        "time",
        "thryd",
        "abeokutakodes"
      ]
    },
    {
      "text": "- a professor of film#jbt",
      "hashtags": [
        "jbt"
      ]
    },
    {
      "text": "- at this point, he knew he don fcked up- one rule, even shagari understood it. you can't fck labour!#seniorboys",
      "hashtags": [
        "seniorboys"
      ]
    },
    {
      "text": "- #time travel is on a close loop- oooorrrr is it?!#textyng#seniorgehs",
      "hashtags": [
        "time",
        "textyng",
        "seniorgehs"
      ]
    },
    {
      "text": "and then shortly after that, we cracked quantum gravity so that people could now talk to spirits without running mad.[[music abbreviations]]#textyng #seniorgehs",
      "hashtags": [
        "textyng",
        "seniorgehs"
      ]
    },
    {
      "text": "[[#tyn = white_house]]- my.transport(#tyn, origin, destination)- na tolu write awa transport library. nice work.- destination = my.near(zuma_rock, sw, 50)- kilomikilometas #abeokutakodes",
      "hashtags": [
        "tyn",
        "abeokutakodes"
      ]
    },
    {
      "text": "- oh glory glory glory to da lord!- hosanna - hosanna hosanna blessed be the name of the lord-- you know say normal normal, titi na fine babe#juniorboys",
      "hashtags": [
        "juniorboys"
      ]
    },
    {
      "text": "- eez simple. if you want to dequeue a queue but you only have two stacks - because such is #life- pls test your #thryd before you push- don't give your viewers buggy experiences- thanks",
      "hashtags": [
        "life",
        "thryd"
      ]
    },
    {
      "text": "and we will just lie and say it was an accident. dey play.#cleack",
      "hashtags": [
        "cleack"
      ]
    },
    {
      "text": "it means neural nuclear bug. na we add the bomb there. just for effect. #nnb",
      "hashtags": [
        "nnb"
      ]
    },
    {
      "text": "ok, now, what are memes? where do they fit in all of this complex craziness?#life#humanity #seniorgehs",
      "hashtags": [
        "life",
        "humanity",
        "seniorgehs"
      ]
    },
    {
      "text": "you're right. it is underemployed. it is not achieving potential. it is missing the mark, pastor.#seniorboys",
      "hashtags": [
        "seniorboys"
      ]
    },
    {
      "text": "- hence, trade invents history and geography -#abeokutakodes",
      "hashtags": [
        "abeokutakodes"
      ]
    },
    {
      "text": "- there are molecules, hydrogen, centripetal forces in this world we live in- ehen - how do you intend to conceptualize arrays and indices here?- i create my own world, and give everyone in this world read/write access - #seniorgehs #abeokutakodes",
      "hashtags": [
        "seniorgehs",
        "abeokutakodes"
      ]
    },
    {
      "text": "my dear, money is not everything.",
      "hashtags": []
    },
    {
      "text": "but...but... [[the urge to say yuwa missing that comma is strong]]#seniorboys",
      "hashtags": [
        "seniorboys"
      ]
    },
    {
      "text": "the importance of dreaming and why the white man doesn't want that for you.#oyinboman",
      "hashtags": [
        "oyinboman"
      ]
    },
    {
      "text": "- my self worth is not determined by your acceptance of me#oyinboman - iiifffsss ddeefff soooo",
      "hashtags": [
        "oyinboman"
      ]
    },
    {
      "text": "- nawa o. shebi dem don die. person no fit celebrate in peace again. #oyinboman",
      "hashtags": [
        "oyinboman"
      ]
    },
    {
      "text": "- to all the young boys and girls here. i want to encourage you. just keep #thryd:ing. i know it seems very difficult rn, but your future self will thank you when you start making your own #discovery:s- writer's guild#textyng #abeokutakodes",
      "hashtags": [
        "thryd",
        "discovery",
        "textyng",
        "abeokutakodes"
      ]
    },
    {
      "text": "what is music? water? air? land? sea?[...]what is music?holes? plugs?[...]spark?source?...[sing]#bta",
      "hashtags": [
        "bta"
      ]
    }
  ]
}

