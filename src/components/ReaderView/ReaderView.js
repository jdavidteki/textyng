import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";

import "./ReaderView.css";

class ConnectedReaderView extends Component {
  constructor(props) {
    super(props);

    this.state = {
			script: null,
      allMessages: [],
      currentNodeIndex: 0,
      selectedSceneId: 1,
    };
  }

  componentDidMount() {
    let scriptId = window.location.pathname.replaceAll("/readerview/", "")

    if(scriptId != ""){
      var textyng = new Script(scriptId);
      textyng.grabScriptFromFirebase(scriptId)
      .then(() => {
        this.setState({
          script: textyng,
          allMessages: textyng.getAllMessagesAsNodes().slice(0,1),
          currentNodeIndex: 1
        })
      })
    }
  }

  componentDidUpdate(prevState) {
    if(prevState.currentNodeIndex != this.state.currentNodeIndex){
      setTimeout(()=>{
        let nextCurNodeIndex = this.state.currentNodeIndex + 1


        this.setState({
          currentNodeIndex: nextCurNodeIndex,
          allMessages: this.state.script.getAllMessagesAsNodes().slice(0, nextCurNodeIndex),
          selectedSceneId: this.state.script.getNthMessageNode(this.state.currentNodeIndex).sceneId
        })
      },
      this.state.script.getNthMessageNode(this.state.currentNodeIndex).tslmsg * 100)
    }
  }

  getScriptName = (name) => {
    return name[1]
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
                  <div key={index} className="ReaderView-scene ReaderView-scene--currentScene">
                    {scene.name}
                  </div>
                ) : (
                  <div key={index} className="ReaderView-scene">
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
                    </div>
                  </div>
                ))}
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
