import React from "react";
import Firebase from "../../firebase/firebase.js";


import "./GroupChat.css";

class GroupChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messageHistory: [], // array of message objects
      userInput: "",
      aiResponse: "",
      username: "yokki",
    };
    this.handleUserInputChange = this.handleUserInputChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.pollOpenAI = this.pollOpenAI.bind(this);
  }

  async pollOpenAI() {
    const { messageHistory } = this.state;

    const openAIAPI = await Firebase.getOpenAIAPI();
    const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    delete configuration.baseOptions.headers['User-Agent'];

    const openai = new OpenAIApi(configuration);

    // construct prompt with message history and username
    const prompt = `NOTE FOR AI: Imagine that you are in a group chat with a user named 
                    ${this.state.username}. The user believes they are chatting with 
                    both Beyonce and James Bond. Your task is to respond 
                    to the user's messages as if you are one of these 
                    characters based on this chat history provided in a JSON format:
                    \n${JSON.stringify(messageHistory, null, 2)}\n  
                    You can choose which character you want to play and whether 
                    they will or will not respond to the user's messages. 
                    You can also make it conditional on certain words or phrases. 
                    The goal is to create a realistic human-like experience. 
                    Please respond to the user's messages in a way that the character 
                    you are playing would respond if they were in a group chat.
                    Send your responses in the format [character name]: [response]
                    so our reactjs front end will be able to parse them correctly.
                    Remember, always read messageHistory before responding to the user.
                    Please make it a nice and friendly experience like this is a real chat.
                    \n\nHuman: ${this.state.username}\nAI:
                `;

    try{
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0.9,
            max_tokens: 150,
            n: 1,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: [" Human:", " AI:"],
        });

        const aiResponse = response.data.choices[0].text;

        const newMessage = {
            sender: "AI",
            message: aiResponse,
            timestamp: new Date().toLocaleString(),
            mood: "neutral", // add mood property if desired
        };

        const newMessageHistory = [...messageHistory, newMessage];
        this.setState({
            messageHistory: newMessageHistory,
        });
    } catch (error) {
        console.log(error);
    }

    // schedule next poll
    setTimeout(this.pollOpenAI, 200000);
  }

  componentDidMount() {
    // start polling OpenAI
    this.pollOpenAI();
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const { messageHistory, userInput } = this.state;

    // create new message object and add to message history
    const newMessage = {
      sender: "user114",
      message: userInput,
      timestamp: new Date().toLocaleString(),
      mood: "neutral", // add mood property if desired
    };
    const newMessageHistory = [...messageHistory, newMessage];
    this.setState({
      messageHistory: newMessageHistory,
      userInput: "",
    }, () => {
        // scroll to bottom of message history
        const messageHistoryContainer = document.querySelector(".message-history");
        messageHistoryContainer.scrollTop = messageHistoryContainer.scrollHeight;

        //hit API endpoint
        this.pollOpenAI();

    });
  }

  handleUserInputChange(event) {
    this.setState({ userInput: event.target.value });
  }

  render() {
    const { messageHistory, aiResponse } = this.state;
    return (
      <div className="group-chat-container">
        <div className="message-history">
          {messageHistory.map((message, index) => (
            <div
              key={index}
            >
              <div className="message-sender">{message.sender}</div>
              <div className="message-text">{message.message}</div>
              <div className="message-timestamp">{message.timestamp}</div>
            </div>
          ))}
        </div>
        <form onSubmit={this.handleFormSubmit} className="user-input">
          <input
            type="text"
            value={this.state.userInput}
            onChange={this.handleUserInputChange}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    );
  }
}

export default GroupChat;
