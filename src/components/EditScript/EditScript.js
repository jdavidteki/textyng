import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import EditableField from "../EditableField/EditableField";
import CastMembers from "../CastMembers/CastMembers";
import Scenes from "../Scenes/Scenes";
import MsgTypes from "../MsgTypes/MsgTypes";
import Button from "@material-ui/core/Button";
import TimeInput from "../TimeInput/TimeInput.js"
import CommentedPopup from "../CommentedPopup/CommentedPopup.js"
import html2canvas from 'html2canvas';
import Firebase from "../../firebase/firebase";

import "./EditScript.css";
import { nil } from "ajv";

class ConnectedEditScript extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rimis: [],
      rimisIds: [],
      filteredRimis: [],
      rimiToShow: null,
      animateGreeting: "EditScript-animategreeting",
      orderId: "",
      script: props.script ? props.script : null,
      isNewScript: props.isNewScript,
      selectedCastId: 1,
      selectedSceneId: 1,
      selectedMsgType: "",
      timeSinceLastMsg: "",
      textMsg: "",
      emotion: "",
      allMessages: [],
      spslm: 0,
      likedByMap:  props.script ? props.script.getOnlyLikedMsgsAsNodes() : new Map(),
    };
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
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

    //TODO do this better
    if (!this.state.isNewScript){
      let scriptId = window.location.pathname.replaceAll("/editscript/", "")

      if(scriptId != ""){
        var textyng = new Script(scriptId);
        textyng.grabScriptFromFirebase(scriptId)
        .then(() => {
          this.setState({
            script: textyng,
            likedByMap: this.generateLikedMap(textyng.getOnlyLikedMsgsAsNodes())
          })
        })
      }
    }else{
      this.setState({likedByMap: this.state.script.getOnlyLikedMsgsAsNodes()})
    }

    this.intervalId = setInterval(() => {
      this.setState({ spslm: this.state.spslm + 1 });
    }, 1000);
  }

  generateLikedMap(likedMessages){
    let map = new Map();

    for (let obj of likedMessages) {
      let key = `${obj.msgLikedId}${obj.msgLikedSenderId}`;
      map.set(key, true);
    }

    return map
  }

  getScriptName = (name) => {
    this.state.script.updateScriptName(name[1])
  }

  getAllCast = (cast) => {
    this.state.script.updateCast(cast)
  }

  getAllScenes = (scenes) => {
    this.state.script.updateScene(scenes)
  }

  getSelectedCast = (cast) => {
    this.setState({selectedCastId: cast.id}, () => {
      this.setState({allMessages: this.state.script.getOnlyTextMsgsAsNodes()})
    })
  }

  getSelectedScene = (scene) => {
    this.setState({selectedSceneId: scene.id}, () => {
      this.setState({allMessages: this.state.script.getOnlyTextMsgsAsNodes()})
    })
  }

  getSelectedMsgType = (value) => {
    this.setState({ textMsg: value}, () => {
      this.addNewMessage()
    });
  }

  alreadyBeenLikedByselectedCastId = (messageId) => {
    let likedMsgID = `${messageId}${this.state.selectedCastId}`

    if(this.state.likedByMap.has(likedMsgID)){
      return this.state.likedByMap.get(likedMsgID)
    }
    return false
  }

  deleteLikedMessage(messageId, whoLikedMsg){
    this.setState({
      likedByMap: this.state.likedByMap.set(`${messageId}${whoLikedMsg}`, false)
    })

    let allMessages = this.state.script.getOnlyLikedMsgsAsNodes()
    const result = allMessages.find(obj => obj.idOfMsgLiked === messageId && obj.whoLikedMsg === whoLikedMsg);

    if(result.id){
      this.deleteMessage(result.id)
    }
  }

  addNewLikeMsg = (messageId, senderId) => {
    if(!this.alreadyBeenLikedByselectedCastId(messageId)){

      var milliseconds = Math.floor(Date.now() / 1000)

      let tslmsg = this.state.timeSinceLastMsg
      if(tslmsg == "" || tslmsg == 0){
        tslmsg = this.state.spslm
      }
      let msgData = {
        id: milliseconds,
        timeStamp: milliseconds,
        msgType: "like",
        whoSentLikedMsg: senderId,
        idOfMsgLiked: messageId,
        whoLikedMsg: this.state.selectedCastId,
        tslmsg: tslmsg,
        sceneId: this.state.selectedSceneId
      }
      this.state.script.addNewMessage(msgData)

      let updatedLikedByMap = new Map(this.state.likedByMap);
      updatedLikedByMap.set(`${messageId}${this.state.selectedCastId}`, true);

      this.setState({
        likedByMap: updatedLikedByMap,
        allMessages: this.state.script.getOnlyTextMsgsAsNodes(),
        spslm: 0,
      })
    }else{
      this.deleteLikedMessage(messageId, this.state.selectedCastId)
    }
  }

  addNewMessage = () => {
    var milliseconds = Math.floor(Date.now() / 1000)

    let tslmsg = this.state.timeSinceLastMsg
    if(tslmsg == "" || tslmsg == 0){
      tslmsg = this.state.spslm
    }

    let msgData = {
      id: milliseconds,
      timeStamp: milliseconds,
      content: this.state.textMsg,
      emotion: this.state.emotion,
      senderId: this.state.selectedCastId,
      tslmsg: tslmsg,
      msgType: "textMsg",
      sceneId: this.state.selectedSceneId,
    }

    this.state.script.addNewMessage(msgData)
    this.setState({
      allMessages: this.state.script.getOnlyTextMsgsAsNodes(),
      textMsg: "",
      emotion: "",
      spslm: 0,
    })
  }

  addNewMsgComment = (comment, idOfMsgCommented, whoSentCommentedMsg) => {
    var milliseconds = Math.floor(Date.now() / 1000)

    let tslmsg = this.state.timeSinceLastMsg
    if(tslmsg == "" || tslmsg == 0){
      tslmsg = this.state.spslm
    }

    let msgData = {
      id: milliseconds,
      timeStamp: milliseconds,
      msgType: "comment",
      content: comment,
      emotion: this.state.emotion,
      whoSentCommentedMsg: whoSentCommentedMsg,
      idOfMsgCommented: idOfMsgCommented,
      whoCommentedMsg: this.state.selectedCastId,
      tslmsg: tslmsg,
      sceneId: this.state.selectedSceneId
    }

    this.state.script.addNewMessage(msgData)
    this.setState({
      allMessages: this.state.script.getOnlyTextMsgsAsNodes(),
      textMsg: "",
      emotion: "",
      spslm: 0,
    })
  }

  addNewMediaMsg = (mediaType, mediaURL, isImg, isAudio, isVideo) => {

    var milliseconds = Math.floor(Date.now() / 1000)

    let tslmsg = this.state.timeSinceLastMsg
    if(tslmsg == "" || tslmsg == 0){
      tslmsg = this.state.spslm
    }

    let msgData = {
      id: milliseconds,
      timeStamp: milliseconds,
      content: mediaType,
      emotion: this.state.emotion,
      senderId: this.state.selectedCastId,
      tslmsg: tslmsg,
      isImg: isImg,
      isAudio: isAudio,
      isVideo: isVideo,
      msgType: "textMsg",
      url: mediaURL,
      sceneId: this.state.selectedSceneId
    }

    this.state.script.addNewMessage(msgData)
    this.setState({
      allMessages: this.state.script.getOnlyTextMsgsAsNodes(),
      textMsg: "",
      emotion: "",
      spslm: 0,
    })
  }

  componentDidUpdate(){
    if(this.state.script){
      this.state.script.updateScriptFirebase()
    }
  }

  getInputTime = (timeInSeconds) => {
    this.setState({
      timeSinceLastMsg: timeInSeconds,
    })
  }

  deleteMessage = (id) => {
    this.state.script.deleteMessage(id)
    this.setState({allMessages: this.state.script.getOnlyTextMsgsAsNodes()},
    () => {
        this.state.script.updateScriptFirebase()
    });
  }

  onSaveComment = (message, idOfMsgCommented, whoSentCommentedMsg) => {
    let existingCommentNode = this.state.script.getCommentNodeByCastIdMsgId(this.state.selectedCastId, idOfMsgCommented)
    if(existingCommentNode != nil){
      this.state.script.editNodeContent(existingCommentNode.id, message)
    }else{
      this.addNewMsgComment(message, idOfMsgCommented, whoSentCommentedMsg)
    }
  }

  grabScreenshot = (url) => {
    const element = document.getElementById('EditScript-chatArea-id');

    html2canvas(element).then(canvas => {
      const imageData = canvas.toDataURL();
      const milliseconds = Math.floor(Date.now() / 1000)
      const storageRef = Firebase.storage().ref("ScreenShot/" + milliseconds);
      storageRef.putString(imageData, 'data_url').then(snapshot => {
        snapshot.ref.getDownloadURL().then(downloadURL => {
          console.log(`Image URL: ${downloadURL}`);
          this.addNewMediaMsg("ScreenShot", downloadURL, true, false, false)
        });
      });
    });
  }

  getInsertedImg = (url) => {
    console.log("url", url)
    this.addNewMediaMsg("InsertImage", url, true, false, false)
  }

  getUplodedVideo = (url) => {
    console.log("url", url)
    this.addNewMediaMsg("UploadedVideo", url, false, false, true)
  }

  getVNURL = (url) => {
    console.log("url", url)
    this.addNewMediaMsg("VoiceNote", url, false, true, false)
  }

  render() {
    if(this.state.script){
        return (
            <div className="EditScript">
                <div className="EditScript-container l-container">
                    <div className="EditScript-title">
                      <EditableField
                        name={this.state.script.getScriptName()}
                        getScriptName={this.getScriptName}
                      />
                    </div>
                    <div className="EditScript-scenes">
                      <Scenes
                        scenes = {this.state.script.getAllScenes()}
                        selectedScene={this.getSelectedScene}
                        getAllScenes={this.getAllScenes}
                      />
                    </div>
                    <div className="EditScript-cast">
                      <CastMembers
                        cast = {this.state.script.getAllCast()}
                        selectedCast={this.getSelectedCast}
                        getAllCast={this.getAllCast}
                      />
                    </div>
                    <div className="EditScript-textView">
                      <MsgTypes
                        grabScreenshot = {this.grabScreenshot}
                        getInsertedImg = {this.getInsertedImg}
                        selectedMsgType = {this.getSelectedMsgType}
                        getUplodedVideo = {this.getUplodedVideo}
                        getVNURL = {this.getVNURL}
                      />
                      <div id="EditScript-chatArea-id" className="EditScript-chatArea">
                        {this.state.allMessages.length == 0 &&
                          <span className="EditScript-castMemberPrompt">click on a cast member to see messages</span>
                        }
                        {this.state.allMessages.map((value, index) => (
                          (value.sceneId == this.state.selectedSceneId)
                          &&
                          <DynamicClassAssignment key={index} isActive={value.senderId == this.state.selectedCastId} value={value} index={index} >
                            {value.isImg &&
                              <img
                                className="EditScript-imgMsg"
                                src={value.url}
                              />
                            }
                            {value.isAudio &&
                              <audio
                                className="EditScript-audioMsg"
                                src={value.url}
                                controls
                              />
                            }
                            {value.isVideo &&
                              <video
                                className="EditScript-videoMsg"
                                src={value.url}
                                controls
                              />
                            }
                            <div>
                              <span className="EditScript-msgIndex">{value.MsgIndex}</span>
                              <span className="EditScript-senderName">{this.state.script.getSenderNameFromID(value.senderId)}</span>
                              <span className="EditScript-senderEmotion">{value.emotion ? '('+value.emotion + ')': ''}</span>
                              <span>{value.content}</span>
                            </div>
                            <div className="EditScript-chatArea-msg-buttons">
                              <button className="EditScript-chatArea-msg-button" onClick={() => this.deleteMessage(value.id)}>Delete</button>
                              <button className="EditScript-chatArea-msg-button" onClick={() => this.addNewLikeMsg(value.id, value.senderId)}>{this.alreadyBeenLikedByselectedCastId(value.id) ? "Unlike" : "Like"}</button>
                              <CommentedPopup
                                className="EditScript-chatArea-msg-button"
                                idOfMsgCommented={value.id}
                                whoSentCommentedMsg={value.senderId}
                                onSave={this.onSaveComment}
                                alreadySavedValue={this.state.script.getCommentByCastIdMsgId(this.state.selectedCastId, value.id)}
                              />
                            </div>
                          </DynamicClassAssignment>
                        ))}
                      </div>

                      <div className="EditScript-sendMessage">
                        <TextField
                          variant="outlined"
                          className="EditScript-sendMessage--input"
                          value={this.state.textMsg}
                          placeholder="Type message here"
                          onChange={e => {
                            this.setState({ textMsg: e.target.value });
                          }}
                        />

                        <TextField
                          variant="outlined"
                          className="EditScript-emotions--input"
                          value={this.state.emotion}
                          placeholder="Type emotion here"
                          onChange={e => {
                            this.setState({ emotion: e.target.value });
                          }}
                        />

                        <TimeInput inputTime={this.getInputTime} />
                      </div>
                      

                      <div className="EditScript-saveSubmit">
                        <div>
                          <Button
                            className="EditScript-saveSubmit--send"
                            variant="outlined"
                            color="primary"
                            onClick={() => this.addNewMessage()}
                          >
                            Send
                          </Button>
                        </div>
                        <div>
                          <Button
                            className="EditScript-saveSubmit--save"
                            variant="outlined"
                            color="primary"
                            onClick={() => this.state.script.updateScriptFirebase()}
                          >
                            save
                          </Button>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        );
    }else{
        return (
            <div className="is-loading">script loading...</div>
        )
    }
  }
}

const mapStateToProps = (state) => {
  return {};
};

let EditScript = withRouter(connect(mapStateToProps)(ConnectedEditScript));
export default withRouter(EditScript);


const DynamicClassAssignment = (props) =>{

    if(props.isActive){
        return (
            <div className={"EditScript-chatArea-msg active"}>
                {props.children}
            </div>
        );
    }else{
        return (
            <div className={"EditScript-chatArea-msg"}>
                {props.children}
            </div>
        );
    }
  }