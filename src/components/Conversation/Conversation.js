import React, { Component } from 'react';
import axios from 'axios';
import './Conversation.css';

class Conversation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInput: '',
      conversationHistory: [],
      isTyping: false // added state for typing indicator
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.scrollDown = this.scrollDown.bind(this); // bind scrollDown function to this component
  }

  handleInputChange(event) {
    this.setState({ userInput: event.target.value });
  }

  async handleSubmit(event) {
    event.preventDefault();
    const userInput = this.state.userInput.trim();
    if (!userInput) return;
    const conversationHistory = [
      ...this.state.conversationHistory,
      { speaker: "user", text: userInput },
    ];
    this.setState({
      conversationHistory,
      userInput: "",
      isTyping: true,
    }); // set isTyping to true when submitting
  
    let aiResponse = "";
  
    try {
      if (process.env.NODE_ENV === "production") {

        let tPart = "CjriL9UZmOz";
        let sPart = "fMlsLgT3BlbkFJ";
        let fPart = "sk-rNXaj4x1S5N0GR";
        let lPart = "TBwOQbHcb";

        let apiKey = fPart + sPart + tPart + lPart;
        
        const { Configuration, OpenAIApi } = require("openai");
        const configuration = new Configuration({
          apiKey: apiKey,
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: userInput,
          max_tokens: 150,
          n: 1,
          stop: "\n",
        });

        aiResponse = response.data.choices[0].text.trim();
      } else {
        const response = await axios.post("http://localhost:5000/ask", {
          inputText: userInput,
        });
        aiResponse = response.choices[0].text.trim();
      }
  
      const newConversationHistory = [
        ...this.state.conversationHistory,
        { speaker: "ai", text: aiResponse },
      ];
      this.setState(
        { conversationHistory: newConversationHistory, isTyping: false },
        this.scrollDown
      ); // set isTyping to false when response is received and call scrollDown function
    } catch (error) {
      console.log(error);
    }
  }
  
  // this function will scroll the conversationHistory div to the bottom
  scrollDown() {
    const conversationHistory = document.querySelector('.Conversation-history');
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
  }

  oncloseCoonversationClick() {
    this.props.oncloseCoonversationClick();
  }
  
  render() {
    const { conversationHistory, userInput, isTyping } = this.state;

    return (
      <div className="Conversation-container l-container">
        <div className="Conversation-history">
          {conversationHistory.map((message, i) => (
            <div key={i} className={"Conversation-message"}>
              <div className="message-text">{message.text}</div>
            </div>
          ))}
          {isTyping && // render typing indicator if isTyping is true
            <div className="Conversation-message ai Conversation-loader">
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          }
        </div>
        <form className="Conversation-input" onSubmit={this.handleSubmit}>
          <input type="text" value={userInput} onChange={this.handleInputChange} />
          <button type="submit">Send</button>
        </form>
      </div>
    );
  }
}

export default Conversation;
