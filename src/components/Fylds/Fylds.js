import React, { Component } from 'react';
import Firebase from "../../firebase/firebase.js";

import './Fylds.css'; //import your css file here

class Fylds extends Component {

  //initialize your state
  state = {
    models: [], //array of model objects
    activeModel: null, //model that is currently selected
    chatInput: '', //user input for chat
    chats: [], //array of chat messages
    placeholder: "do you even have any idea?"
  }

  int1 = null;

  async componentDidMount() {
    await Firebase.getFylds().then((fylds) => {
      this.setState({ models: fylds });
    });

    this.int1 = setInterval(() => {
      Firebase.getFylds().then((fylds) => {
        this.setState({ models: fylds });
      });
    }, 5000);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const cloudWidth = 150;
    const cloudHeight = 100;
    const maxClouds = Math.floor((screenWidth * screenHeight) / (cloudWidth * cloudHeight * 4));
    const clouds = document.querySelectorAll(".cloud");
    const numClouds = Math.min(clouds.length, maxClouds);
    
    for (let i = 0; i < numClouds; i++) {
      const delay = Math.random() * 5;
      const x = Math.random() * 100;
      const y = Math.random() * 90;
      clouds[i].style.animationDelay = delay + "s";
      clouds[i].style.left = x + "%";
      clouds[i].style.top = y + "%";
    }
  
    for (let i = numClouds; i < clouds.length; i++) {
      clouds[i].style.display = "none";
    }
  }
  
  componentWillUnmount(){
    clearInterval(this.int1);
  }

  //function to handle model selection
  handleModelClick = (model) => {
    this.setState({ 
      activeModel: model,
      placeholder: "say something to " + model.name + "..."
    });
  }

  //function to handle user chat input
  handleChatInput = (event) => {
    this.setState({ chatInput: event.target.value });
  }

  //function to handle sending a chat message
  handleSendMessage = async () => {
    let { activeModel, chatInput } = this.state;
  
    // create a new fyld
    if (chatInput.startsWith("y:")) {

      let fyld = {
        name: chatInput.slice(2),
        description: chatInput.slice(2),
        image: "",
        friends: "everything",
        dateCreated: new Date().toLocaleDateString('en-US')
      };

      await Firebase.createFyld(fyld).then((response) => {
        this.setState({ 
          chatInput: `thanks, created ${fyld.name}!`
        });

        setTimeout(() => {
          this.setState({ 
            chatInput: '',
          });
        }, 3000);
      });

      return
    }

    // if no model is selected, do nothing
    if (!activeModel) {

      activeModel = {
        name: "anything",
        description: "anything",
        image: "https://i.imgur.com/3Zo7z6S.png",
        friends: "everything",
        dateCreated: "2022-02-28"
      }

      this.setState({ 
        activeModel: activeModel,
        placeholder: "say something to anything...",
      });
    };
    
    // add user's input to chat history
    const newChat = { sender: 'user', message: chatInput };
    this.setState(prevState => ({
      chats: [...prevState.chats, newChat],
      chatInput: ''
    }));

    // send user's input to OpenAI API and get AI's response
    const openAIAPI = await Firebase.getOpenAIAPI();
    const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
  
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({ apiKey: openaiApiKey });
    delete configuration.baseOptions.headers['User-Agent'];

    const prompt = `MUST READ NOTE: The person chatting with you thinks they are talking to
                    ${activeModel.name}. Please interact with them as if you were 
                    ${activeModel.name} and chat with them. This is your conversation history with them
                    \n\n${this.state.chats}\n\nUser: ${newChat}\nAI:`;

    
    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 150,
      n: 1,
      stop: ["\nUser:", "AI:"]
    });
    const aiResponse = response.data.choices[0].text.trim();
  
    // add AI's response to chat history
    const newChatAI = { sender: 'ai', message: aiResponse };
    this.setState(prevState => ({
      chats: [...prevState.chats, newChatAI]
    }));
  }

  render() {
    const { models, activeModel, chatInput, chats } = this.state;

    //render floating clouds for each model
    const cloudList = models.map((model) => (
      <div
        key={model.name}
        className={`cloud`} //className={`cloud ${model === activeModel ? 'active' : ''}`}
        onClick={() => this.handleModelClick(model)}
      >
        {model.name}
      </div>
    ));

    //render chat popup if a model is selected
    let chatPopup = null;
    if (activeModel !== null) {
      chatPopup = (
        <div className="chat-popup">
          <div className="chat-close" onClick={
            () => this.setState({
              activeModel: null, 
              placeholder: "do you even have any idea?",
              chatInput: '',
            })}
          >
            X
          </div>
          <div className="chat-header">{`Hello, my name is ${activeModel.name}. What's going on?`}</div>
          <div className="chat-messages">
            {chats.map((chat, index) => (
              chat.sender === 'user' ? 
                <div key={index} className={`chat-message user`}>
                  {chat.message}
                </div> 
              :
                <div key={index} className={`chat-message ai`}>
                  {chat.message}
                </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="Fylds">
        <div className="cloud-container">{cloudList}</div>
        <div className="Fylds-searchbar">
            <input
              className="chat-input"
              type="text"
              placeholder={this.state.placeholder}
              value={chatInput}
              onChange={this.handleChatInput}
            />
          <button className="chat-send-button" onClick={this.handleSendMessage}>
            Send
          </button>
        </div>
        {chatPopup}
      </div>
    );
  }
}

export default Fylds;
