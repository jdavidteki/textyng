import React from "react";
import axios from "axios";

import "./CwC.scss";

class CwC extends React.Component {
  state = {
    messages: [],
    inputText: "",
    waitingForResponse: false,
  };

  handleInputTextChange = (event) => {
    this.setState({ inputText: event.target.value });
  };

  handleFormSubmit = (event) => {
    event.preventDefault();

    if (this.state.inputText.trim() === "") {
      return;
    }

    this.setState((prevState) => ({
      messages: [
        ...prevState.messages,
        {
          text: this.state.inputText,
          sender: "user",
        },
      ],
      inputText: "",
      waitingForResponse: true,
    }));

    axios
      .post("http://localhost:5000/ask", { inputText: this.state.inputText })
      .then((response) => {
        this.setState((prevState) => ({
          messages: [
            ...prevState.messages,
            {
              text: response.data,
              sender: "bot",
            },
          ],
          waitingForResponse: false,
        }));
      })
      .catch((error) => {
        console.log(error);
        this.setState({ waitingForResponse: false });
      });
  };

  render() {
    return (
      <div className="cwc l-container">
        <div className="cwc-messages">
          {this.state.messages.map((message, index) => (
            <div
              key={index}
            //   className={`cwc-message cwc-message--${message.sender}`}
            >
              <div className="cwc-message-content">{message.text}</div>
            </div>
          ))}
          {this.state.waitingForResponse && (
            <div className="cwc-message cwc-message--bot">
              <div className="cwc-message-content cwc-message-content--loading">
                <div className="cwc-loading-indicator"></div>
              </div>
            </div>
          )}
        </div>
        <form className="cwc-input-form" onSubmit={this.handleFormSubmit}>
          <input
            type="text"
            className="cwc-input-text"
            placeholder="ask kiyo something"
            value={this.state.inputText}
            onChange={this.handleInputTextChange}
          />
          <button type="submit" className="cwc-submit-button">
            Send
          </button>
        </form>
      </div>
    );
  }
}

export default CwC;
