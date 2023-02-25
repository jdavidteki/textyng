import React, { Component } from "react";
import "./ScriptGenerator.css";

class ScriptGenerator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputJson: "",
      outputScript: "",
      scriptName: "",
      castMembers: [],
      messages: [],
      error: "",
    };
  }

  handleChange = (event) => {
    const inputJson = event.target.value;
    this.setState({ inputJson });
  };

  generateScript = () => {
    try {
      const data = JSON.parse(this.state.inputJson);
      const scriptName = data.name;
      const messages = data.messages || [];
      const castMembers = data.cast.map((member) => member.name);
      const messagesByMsgIndex = messages.slice().sort((a, b) => a.msgIndex - b.msgIndex);
      const scriptLines = [];
      scriptLines.push(`${scriptName.toUpperCase()}`);
    
      for (let i = 0; i < messagesByMsgIndex.length; i++) {
        const message = messagesByMsgIndex[i];
        const member = castMembers[message.senderId - 1];
        scriptLines.push(`\n${member.toUpperCase()}:`);
        scriptLines.push(`${member}: ${message.content}`);
      }
    
      const outputScript = scriptLines.join("\n");
      this.setState({ outputScript, scriptName, castMembers, messages });
    } catch (error) {
      this.setState({ error: "Invalid JSON input" });
    }
  };
  
  render() {
    const { inputJson, outputScript, scriptName, messages, error } = this.state;
    let castMembers = [];
  
    if (outputScript) {
      castMembers = messages.reduce((members, message) => {
        if (!members.includes(message.senderId)) {
          members.push(message.senderId);
        }
        return members;
      }, []);
    }
  
    return (
      <div className="script-generator l-container">
        <div className="script-generator__header">Script Generator</div>
        <div className="script-generator__content">
          <div className="script-generator__input-wrapper">
            <textarea
              className="script-generator__input"
              value={inputJson}
              onChange={this.handleChange}
              placeholder="Paste your JSON here"
            />
          </div>
          <button className="script-generator__button" onClick={this.generateScript}>
            Generate Script
          </button>
          {error && <div className="script-generator__error">{error}</div>}
          {outputScript && (
            <div className="script-generator__output-wrapper">
              <div className="script-generator__output-header">{scriptName.toUpperCase()}</div>
              <div className="script-generator__cast">
                {outputScript}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ScriptGenerator;