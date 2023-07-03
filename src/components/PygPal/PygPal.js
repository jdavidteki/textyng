import React, { Component } from 'react';
import Firebase from "../../firebase/firebase.js";
const { Configuration, OpenAIApi } = require("openai");

import './PygPal.css';

class PygPal extends Component {
  state = {
    url: '',
    extractedData: null,
    chatInput: '',
    chats: [],
    placeholder: '',
    isDataExtracted: false,
    openai: null,
    placeholder: 'Ask questions about the extracted data...'
  };

    componentDidMount = async () =>{
        await this.CreateOpenAIModel();

        const extractedData = await this.extractDataFromPage("https://jsonplaceholder.typicode.com/");
        this.sendPageContentToModel(extractedData);
        this.setState({
            extractedData: extractedData,
            isDataExtracted: true,
        });
    }

    handleUrlSubmit = async (e) => {
        const { url } = this.state;

        const extractedData = await this.extractDataFromPage(url);
        this.setState({
            extractedData: extractedData,
            isDataExtracted: true,
            chats: [],
        }, () => {
            this.sendPageContentToModel(extractedData);
        });
    };

    CreateOpenAIModel = async () => {
        const openAIAPI = await Firebase.getOpenAIAPI();
        const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
        const configuration = new Configuration({ apiKey: openaiApiKey });
        delete configuration.baseOptions.headers['User-Agent'];
        const openai = new OpenAIApi(configuration);

        this.setState({openai: openai});
    }

    sendPageContentToModel = async (extractedData) => {
        const prompt = `MUST READ NOTE: The person chatting with you thinks they are talking to 
                        the content of ${this.state.url}. Please interact with them as if you 
                        were the content of ${this.state.url} and chat with them. Find attached 
                        the content of ${this.state.url}: \n\n${extractedData.paragraphs}\n\nUser:`

        const GPT35TurboMessage = [
            {
                role: "user",
                content: prompt
            },
        ];

        const response = await this.state.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: GPT35TurboMessage,
        });
        const aiResponse = response.data.choices[0].message.content;


        this.setState((prevState) => ({
            chats: [...prevState.chats, GPT35TurboMessage[0]]
        }));
    };

    extractDataFromPage = async (url) => {
        try {
            const response = await fetch(url);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const paragraphs = Array.from(doc.querySelectorAll('p')).map((p) => p.textContent);
            const extractedData = {
                paragraphs: paragraphs,
            };

            return extractedData;
        } catch (error) {
            console.error('Error extracting data:', error);
            return {};
        }
    };
  

    handleSendMessage = async () => {
        const { chatInput } = this.state;

        if (this.state.isDataExtracted) {

            // Add user's input to chat history
            const newChat = { 
                role: 'user', 
                content: chatInput 
            };
            
            this.setState(
                (prevState) => ({
                  chats: [...prevState.chats, newChat],
                  chatInput: ''
                }),
                async () => {

                  const response = await this.state.openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: this.state.chats,
                  });
                  const aiResponse = response.data.choices[0].message.content;
              
                  // add AI's response to chat history
                  let newChatAI = {
                    role: 'assistant',
                    content: aiResponse
                  };
                  this.setState((prevState) => ({
                    chats: [...prevState.chats, newChatAI]
                  }));
                }
            );

        } else {
            // Handle case where data extraction is not complete or activeModel is not set
            // ...
        }
    };

    render() {
        const { url, extractedData, chatInput, chats, placeholder, isDataExtracted } = this.state;

        return (
            <div className='PygPal l-container'>
                <div className='PygPal-extractURL'>
                    <input
                        className='PygPal-extractDataInput'
                        type="text"
                        value={url}
                        onChange={(e) => this.setState({ url: e.target.value })}
                        placeholder="Enter a URL"
                    />
                    <button onClick={this.handleUrlSubmit} type="submit">Extract Data</button>
                </div>

                {isDataExtracted &&
                    // Render the text messaging interface
                    //https://www.moesif.com/blog/technical/cors/Authoritative-Guide-to-CORS-Cross-Origin-Resource-Sharing-for-REST-APIs/
                    <div className='PygPal-bottomSection'>
                        {/* Render extracted data */}
                        {extractedData && extractedData.paragraphs && (
                            <div className='PygPal-extractedData'>
                                <h2>Extracted Data</h2>
                                <ul>
                                    {extractedData.paragraphs.map((paragraph, index) => (
                                        <li key={index}>{paragraph}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className='PygPal-chatInterface'>
                            {/* Render chat history */}
                            <div className='PygPal-chatHistory'>
                                <h2>Chat History</h2>
                                <ul className='PygPal-chatHistoryList'>
                                    {chats.slice(1).map((chat, index) => (
                                        <li className='PygPal-chatHistoryList-li' key={index}>
                                            {chat.role}: {chat.content}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <input
                                className='PygPal-messageInput'
                                type="text"
                                value={chatInput}
                                onChange={(e) => this.setState({ chatInput: e.target.value })}
                                placeholder={placeholder}
                            />
                            <button type="submit" onClick={this.handleSendMessage}>
                                Send
                            </button>
                        </div>
                    </div>
                }
            </div>
        );
    }
}

export default PygPal;
