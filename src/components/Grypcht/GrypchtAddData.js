import React, { Component } from "react";
import Firebase from "../../firebase/firebase.js";
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from 'react-router-dom';

const { Configuration, OpenAIApi } = require("openai");

import "./GrypchtAddData.css";


class GrypchtAddData extends Component {
    constructor(props) {
        super(props);

        this.state = {
            grypcht: {
                groupName: "",
                members: [],
                dateCreated: "",
            },
            chatInput: '',
            chatMessages: [],
            isComplete: false,
            openai: null,

            initialMsg: {
                role: "assistant",
                content: `You are assisting in creating a Grypcht JSON object. 
                The object should include the following fields: groupName (string), 
                members (array), and dateCreated (string), and description (string),
                isPrivateGrypcht (boolean). Please interact with the user to get the values of each field and update 
                the Grypcht object accordingly. Once the user confirms that the object 
                is complete, return the validated JSON object. Please make it as 
                interactive as possible.`
            }
        };
    }

    componentDidMount = async () => {
        await this.CreateOpenAIModel();
    }

    CreateOpenAIModel = async () => {
        const openAIAPI = await Firebase.getOpenAIAPI();
        const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
        const configuration = new Configuration({ apiKey: openaiApiKey });
        delete configuration.baseOptions.headers['User-Agent'];
        const openai = new OpenAIApi(configuration);

        this.setState({ openai: openai });
    }

    handleChatMessage = async () => {
        const { chatMessages, chatInput } = this.state;

        const userMessage = {
            role: "user",
            content: chatInput,
        };

        const updatedChatMessages = [...chatMessages, userMessage];
        if (!chatMessages.length) {
            updatedChatMessages.push(this.state.initialMsg);
        }
        this.setState({
            chatMessages: updatedChatMessages,
            chatInput: ''
        });

        // Call the model API to get the AI-generated response
        const response = await this.state.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: updatedChatMessages,
        });

        const aiResponse = response.data.choices[0].message.content;

        // add AI's response to chat history
        let newChatAI = {
            role: 'assistant',
            content: aiResponse
        };
        this.setState((prevState) => ({
            chatMessages: [...prevState.chatMessages, newChatAI],
        }));

        // Process the AI-generated response and update the Grypcht object
        this.searchResponseForGrpcht(aiResponse);
    };

    searchResponseForGrpcht(response) {
        const { grypcht } = this.state;

        // Extract the JSON substring from the AI response
        const jsonStartIndex = response.indexOf('{');
        const jsonEndIndex = response.lastIndexOf('}');
        const jsonSubstring = response.substring(jsonStartIndex, jsonEndIndex + 1);

        console.log("Extracted JSON substring:", response);

        // Parse the extracted JSON substring
        let extractedData;
        try {
            extractedData = JSON.parse(jsonSubstring);

            // Update the Grypcht object based on the extracted information
            const updatedGrypcht = {
                ...grypcht,
                ...extractedData, // Update the fields based on the extracted JSON data
            };

            // Generate an ID for the Grypcht object
            const id = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
            updatedGrypcht.id = id;

            // Call Firebase.createGrypcht to save the Grypcht object
            Firebase.createGrypcht(updatedGrypcht).then(() => {
                this.setState({ isComplete: true, grypcht: updatedGrypcht });

                // Route the user to the /grypcht/[groupid] URL
                window.history.pushState(null, "", `/grypcht/${id}`);
                window.location.reload();
            });
        } catch (error) {
            console.error("Failed to parse JSON from AI response:", error);
            return;
        }
    }


    render() {
        const { grypcht, chatMessages, isComplete } = this.state;

        if (isComplete) {
            return (
                <div>
                    <h2>Grypcht Created!</h2>
                    <p>Group Name: {grypcht.groupName}</p>
                    <p>Members: {grypcht.members.join(", ")}</p>
                    <p>Date Created: {grypcht.dateCreated}</p>
                </div>
            );
        }

        return (
            <div className="GrypchtAddData l-container">
                <h2>Create Grypcht</h2>
                <div>
                    <h3>Chat</h3>
                    {chatMessages.map((message, index) => (
                        message !== this.state.initialMsg ? (
                            <p key={index}>
                                {message.role}: {message.content}
                            </p>
                        ) : null
                    ))}
                </div>
                <div>
                    <input
                        type="text"
                        value={this.state.chatInput}
                        onChange={(e) => this.setState({ chatInput: e.target.value })}
                    />
                    <button onClick={() => this.handleChatMessage()}>Send</button>
                </div>
            </div>
        );
    }
}

export default GrypchtAddData;
