import React from "react";

function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((message, index) => (
        <li key={index}>
          <strong>{message.author}:</strong> {message.text}
        </li>
      ))}
    </ul>
  );
}

class MessageForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ text: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const text = this.state.text.trim();
    if (!text) return;
    this.props.onMessageSubmit({ author: "You", text: text });
    this.setState({ text: "" });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input type="text" onChange={this.handleChange} value={this.state.text} />
        <button>Send</button>
      </form>
    );
  }
}

export { MessageList, MessageForm };
