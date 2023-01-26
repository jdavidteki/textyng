import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import { Emoji } from 'emoji-mart'

import "./ReaderView.css";

const emojis = [
  {name: "exploding_head", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "relaxed", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "astonished", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "pensive", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "angry", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "scream", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "kissing_heart", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
  {name: "rolling_on_the_floor_laughing", set: "twitter", size: 16, className: "ReaderView-reactionEmoji"},
]

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
    };
  }

  componentDidMount() {
    //hack: use this to fix github pages doing ?/ on pages
    if (window.location.href.includes("?/")){
      let actualDestination = window.location.href.split("?/")[1]
      if(this.props.history == undefined){
        //TODO: figure out if it's possible to not have to do this
        window.location.href = "/" + actualDestination
      }else{
        this.props.history.push({
          pathname: "/" + actualDestination
        });
        window.location.reload(false);
      }
    }

    let scriptId = window.location.pathname.replaceAll("readerview", "").replaceAll("/", "");
    if (scriptId == "") {
      scriptId = "NewScript1674709550"
    }

    let textyng = new Script(scriptId);
    textyng
      .grabScriptFromFirebase(scriptId)
      .then(() => {
        this.setState({ script: textyng }, () => {
          this.updateCurrentNode();
          this.startAutoPlay();
        });
      });
  }

  updateCurrentNode(index = 0) {
    if (!this.state.script) {
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
    if (this.state.isPlaying) {
      this.setState({
        timeoutId: setTimeout(() => {
          this.handleNextClick();
        }, this.state.script.getNthMessageNode(this.state.currentNodeIndex).tslmsg * 100)
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


  handlePlayPauseClick = () => {
    clearTimeout(this.state.timeoutId);
    this.setState(prevState => ({ isPlaying: !prevState.isPlaying }));
  };

  handleNextClick = () => {
    clearTimeout(this.state.timeoutId);
    this.updateCurrentNode(this.state.currentNodeIndex + 1);
    this.startAutoPlay();
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
        size={16}
        key={index}
        className="ReaderView-reactionEmoji"
      />
    ));

    // console.log("readerEmojiReactions", readerEmojiReactions)

    return readerEmojiReactions
  }

  render() {
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
            <div className="ReaderView-textView">
              <div id="ReaderView-chatArea-id" className="ReaderView-chatArea">
                {this.state.allMessages
                .map((message, index) => (
                  (message.sceneId == this.state.selectedSceneId)
                  &&
                  <div key={index} className="ReaderView-chatArea-msg">
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
                    <div>
                      <span>{message.content}</span>
                      <span className="ReaderView-senderName">{this.state.script.getSenderNameFromID(message.senderId)}</span>
                      
                      <div className="ReaderView-reactionEmojis">
                        {emojis.map((emoji, index)=> 
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
              <span>reactions:</span> 
              <span className="ReaderView-readerReaction"> {this.getReaderReactionFromMsg()}</span>                       
            </div>
            <div className="ReaderView-navigation">
              <div className="ReaderView-navigation--wrapper">
                <div className="previous-button" onClick={this.handlePreviousClick}>
                  <i className="fas fa-arrow-left"></i>
                </div>
                <div className="play-pause-button" onClick={this.handlePlayPauseClick}>
                  {this.state.isPlaying ? 
                    <i className="fas fa-pause"></i> : 
                    <i className="fas fa-play"></i>
                  }
                </div>
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
        <div className="ReaderView">
					loading scriptsss
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
