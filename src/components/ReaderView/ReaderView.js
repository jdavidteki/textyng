import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import { Emoji } from 'emoji-mart'
import Conversation from "../Conversation/Conversation.js";

import "./ReaderView.css";

class ConnectedReaderView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      script: null,
      allMessages: [],
      currentNodeIndex: 0,
      selectedSceneId: 1,
      timeoutId: null,
      isPlaying: true,
      showConversation: false,
    };

    this.emojis = [
      {name: "rolling_on_the_floor_laughing", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "relaxed", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "angry", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "astonished", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "kissing_heart", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "exploding_head", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "pensive", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
      {name: "scream", set: "twitter", size: 14, className: "ReaderView-reactionEmoji"},
    ]
  }

  componentDidUpdate(){
    if(document.querySelector('.ReaderView-chatArea')){
      const chatArea = document.querySelector(".ReaderView-chatArea");
      const startPosition = chatArea.scrollTop;
      const endPosition = chatArea.scrollHeight;
      const duration = 1000; // 1 second
      const numberOfSteps = 10;
      const stepDuration = duration / numberOfSteps;
      const scrollAmount = (endPosition - startPosition) / numberOfSteps;
      
      let currentStep = 0;
    
      const animateScrollStep = function() {
        chatArea.scrollTop += scrollAmount;
        currentStep++;
        if (currentStep < numberOfSteps) {
          setTimeout(animateScrollStep, stepDuration);
        }
      }
    
      setTimeout(animateScrollStep, stepDuration);
    }

    const currentScene = document.querySelector(".ReaderView-scene--currentScene");
    const scenes = document.querySelector(".ReaderView-scenes");
    if (currentScene) {
      scenes.scrollLeft = currentScene.offsetLeft - scenes.offsetLeft - (scenes.offsetWidth - currentScene.offsetWidth) / 2;
    }

    if(document.querySelector('.ReaderView-readerReaction')){
      const chatArea = document.querySelector(".ReaderView-readerReaction");
      chatArea.scrollLeft = chatArea.scrollWidth;
    }

    const msgElements = document.querySelectorAll(".ReaderView-chatArea-msg");
    for (const msgElement of msgElements) {
      if (msgElement.getAttribute("data-attribute-ispotagonist") === "true") {
        msgElement.classList.add("isProtagonist");
      }
    }
  }

  componentDidMount() {
    let scriptId = this.props.match.params.id
    if (scriptId == "") {
      scriptId = "NewScript1674709550"
    }

    let textyng = new Script(scriptId);
    textyng
      .grabScriptFromFirebase(scriptId)
      .then(() => {
        this.setState({ script: textyng }, () => {
          this.updateCurrentNode();
          // this.startAutoPlay(); TODO: uncomment this line to autoplay
          this.handleNextClick();
        });
      });
  }

  updateCurrentNode(index = this.state.currentNodeIndex + 1) {
    if (!this.state.script || !this.state.script.getNthMessageNode(index)) {
      return;
    }
  
    let sceneId = this.state.script.getNthMessageNode(index).sceneId;
    if (sceneId === undefined) {
        sceneId = this.state.script.getTotalNumScenes();
    }
    this.setState({
        currentNodeIndex: index,
        allMessages: this.state.script.getAllMessagesAsNodes().slice(0, index),
        selectedSceneId: sceneId
    });
  }

  startAutoPlay() {
    if (this.state.isPlaying && this.state.currentNodeIndex < this.state.script.getAllMessagesAsNodes().length) {
      this.setState({
        timeoutId: setTimeout(() => {
          this.handleNextClick();
        }, this.state.script.getNthMessageNode(this.state.currentNodeIndex).tslmsg * 20)
      });
    }
  }

  handlePreviousClick = () => {
    // check if script is null
    if (!this.state.script) {
        return;
    }
    clearTimeout(this.state.timeoutId);
    this.setState(prevState => {
        if (prevState.currentNodeIndex === 0) {
            return {}; // no further action needed
        }
        let prevNodeIndex = prevState.currentNodeIndex - 1;
        let sceneId = this.state.script.getNthMessageNode(prevNodeIndex).sceneId;
        if (sceneId === undefined) {
            sceneId = this.state.script.getTotalNumScenes();
        }
        let newAllMessages = prevState.allMessages.slice();
        if (prevState.allMessages.length === 1) {
            newAllMessages = prevState.allMessages; // don't update to an empty array
        } else {
            newAllMessages = this.state.script.getAllMessagesAsNodes().slice(0, prevNodeIndex);
        }
        return {
            currentNodeIndex: prevNodeIndex,
            allMessages: newAllMessages,
            selectedSceneId: sceneId
        };
    });
  };

  handleSpanClick = () => {
    this.setState({ showConversation: true });
  }

  handlePlayPauseClick = () => {
    clearTimeout(this.state.timeoutId);
    this.setState(prevState => ({ isPlaying: !prevState.isPlaying }));
  };

  handleNextClick = () => {
    clearTimeout(this.state.timeoutId);
    this.updateCurrentNode(this.state.currentNodeIndex + 1);
    // this.startAutoPlay(); //TODO: uncomment this line to autoplay
  };

  getScriptName = (name) => {
    return name[1]
  }

  selectThisScene = (sceneId) => {
    this.setState({
      selectedSceneId: sceneId,
      allMessages: this.state.script.getAllMessagesAsNodes(),
    })
  }

  reactionClicked = (emojiName, messageId, event) => {
    event.currentTarget.classList.add('shake');
    this.state.script.updateReaderReaction(emojiName, messageId)
  }

  getReaderReactionFromMsg = () => {
    let reactionArray = [];
    this.state.allMessages.forEach(message => {
      if(this.state.script.getReaderReactionMap().has(message.id.toString())) {
        reactionArray.push(...this.state.script.getReaderReactionMap().get(message.id.toString()));
      }
    });

    let readerEmojiReactions = reactionArray.map((emoji, index) => (
      <Emoji
        emoji={emoji}
        set={"twitter"}
        size={14}
        key={index}
        className="ReaderView-reactionEmoji"
      />
    ));

    return readerEmojiReactions
  }

  closeConversation = () => {
    this.setState({ showConversation: false });
  }

  render() {
    const { script, selectedMessageIndex } = this.state;
    const senderName = (message) => script.getSenderNameFromID(message.senderId);
    
		if(this.state.allMessages && this.state.allMessages.length > 0){
			return (
        <div className="ReaderView">
          <div className="ReaderView-container l-container">
            <div className="ReaderView-title">
              {this.state.script.getScriptName()}
            </div>
            <div className="ReaderView-scenes">
              {this.state.script.getScenes()
              .map((scene, index) =>
                scene.id == this.state.selectedSceneId ? (
                  <div key={index} onClick={() => this.selectThisScene(scene.id)} className="ReaderView-scene ReaderView-scene--currentScene">
                    {scene.name}
                  </div>
                ) : (
                  <div key={index} onClick={() => this.selectThisScene(scene.id)} className="ReaderView-scene">
                    {scene.name}
                  </div>
                )
              )}
            </div>
            <div className="ReaderView-msgCounts">
              {this.state.allMessages.length} / {this.state.script.getAllMessagesAsNodes().length}
            </div>
            <div className="ReaderView-textView">
              <div id="ReaderView-chatArea-id" className="ReaderView-chatArea">
                {this.state.allMessages
                .map((message, index) => (
                  (message.sceneId == this.state.selectedSceneId)
                  &&
                  <div key={index} className="ReaderView-chatArea-msg" data-attribute-ispotagonist={message.senderId === 1 ? true : false}>
                    {message.isImg &&
                      <img
                        className="ReaderView-imgMsg"
                        src={message.url}
                      />
                    }
                    {message.isAudio &&
                      <audio
                        className="ReaderView-audioMsg"
                        src={message.url}
                        controls
                      />
                    }
                    {message.isVideo &&
                      <video
                        className="ReaderView-videoMsg"
                        src={message.url}
                        controls
                      />
                    }
                    {/* //TODO: delete very msgtype like of an original message if original message was deleted */}
                    {message.msgType == "like" && this.state.script.getNodeByMessageId(message.idOfMsgLiked) &&
                      <div
                        className="ReaderView-msgLike"
                      >
                        <span>
                          {this.state.script.getSenderNameFromID(message.whoLikedMsg)}&nbsp;
                          liked message&nbsp;
                          {this.state.script.getNodeByMessageId(message.idOfMsgLiked).data.MsgIndex}&nbsp;
                          by&nbsp;
                          {this.state.script.getSenderNameFromID(message.whoSentLikedMsg)}&nbsp;
                        </span>
                      </div>
                    }
                    {message.msgType == "action" &&
                      <div
                        className="ReaderView-msgTypeAction glowing-text"
                      >
                          <span className="ReaderView-senderName">{this.state.script.getSenderNameFromID(message.senderId)}</span>
                          <span>y: {message.content}</span> 
                      </div>
                    }
                    {message.msgType == "authorAction" &&
                      <div
                        className="ReaderView-msgTypeAuthorAction glowing-text"
                      >
                        <div className="ReaderView-content">
                          yy: {message.content}
                        </div>
                      </div>
                    }
                    {message.msgType != "action" && message.msgType != "authorAction" &&
                      <div className="ReaderView-isnotactionMsg">
                        {this.state.showConversation ? (
                          <div className="ReaderView-conversation-container">
                            <div className="ReaderView-conversation-close" onClick={this.closeConversation}>
                              X
                            </div>
                            <Conversation
                              className = "ReaderView-conversation"
                              messages={script.messages}
                              selectedMessageIndex={selectedMessageIndex}
                              oncloseCoonversationClick={this.closeConversation}
                              senderName={senderName}  
                            />
                          </div>
                        ) : (
                          <span className="ReaderView-senderName checking something!" onClick={this.handleSpanClick}>
                            {this.state.script.getSenderNameFromID(message.senderId)}
                          </span>
                        )}
                        <span className="ReaderView-senderEmotion">{message.emotion ? '('+message.emotion + ')': ''}</span>
                        <span>{message.content}</span>
                      </div>
                    }  
                    <span className="ReaderView-msgIndex">{message.MsgIndex}</span>
                    <div className="ReaderView-reactionEmojis-container">
                      <div className="ReaderView-reactionEmojis">
                        {this.emojis.map((emoji, index)=> 
                          <div
                            key={index}
                            className="ReaderView-reactionEmoji"
                            onClick={(e) => this.reactionClicked(emoji.name, message.id, e)}
                          >
                            <Emoji 
                              emoji={emoji.name}
                              set={emoji.set} 
                              size={emoji.size} 
                              key={emoji.name} 
                              className="ReaderView-reactionEmoji"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ReaderView-readerReaction--wrapper">
              <div className="ReaderView-readerReaction"> {this.getReaderReactionFromMsg()}</div>                       
            </div>
            <div className="ReaderView-navigation">
              <div className="ReaderView-navigation--wrapper">
                <div className="previous-button" onClick={this.handlePreviousClick}>
                  <i className="fas fa-arrow-left"></i>
                </div>
                {/* <div className="play-pause-button" onClick={this.handlePlayPauseClick}>
                  {this.state.isPlaying ? 
                    <i className="fas fa-pause"></i> : 
                    <i className="fas fa-play"></i>
                  }  //TODO: add play pause functionality
                </div> */}
                <div className="next-button" onClick={this.handleNextClick}>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
    	);
		}else{
			return (
        <div className="ReaderView is-loading">
					rytriving script
        </div>
    	);
		}
  }
}

const mapStateToProps = (state) => {
  return {};
};

let ReaderView = withRouter(connect(mapStateToProps)(ConnectedReaderView));
export default withRouter(ReaderView);
