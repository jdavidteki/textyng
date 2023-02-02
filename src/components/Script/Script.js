import { DataArray } from "@mui/icons-material";
import React, { Component } from "react";
import firebase from "../../firebase/firebase";

class MessageNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class Script {
  constructor(name) {
    var milliseconds = Math.floor(Date.now() / 1000)

    this.name = name;
    this.dateCreated = milliseconds
    this.id = name + milliseconds
    this.cast = [];
    this.crew = [];
    this.scenes = [];
    this.head = null;
    this.messages = new MessageNode();
    this.node = {};
    this.totalNoMsgs = 0;
    this.readerReactionMap = new Map();
    this.isPrivateScript = false;
  }

  updateScriptName(name){
    this.name = name
    this.updateIsPrivateScript()
  }

  updateIsPrivateScript(){
    if(this.name.startsWith("yyyy")){
      this.isPrivateScript = true
    }
  }

  numberOfMessages() {
    let count = 0;
    let node = this.head;
    while (node) {
      count++;
      node = node.next;
    }
    return count;
  }

  getScenes(){
    return this.scenes
  }

  updateReaderReaction(emojiName, messageId){
    if (!this.readerReactionMap.has(messageId)) {
      this.readerReactionMap.set(messageId, []);
    }
    this.readerReactionMap.get(messageId).push(emojiName);

    this.updateScriptFirebase()
  }

  getReaderReactionMap(){
    return this.readerReactionMap
  }

  getTotalNumScenes(){
    return this.getScenes().length
  }

  deleteScript() {
    this.head = null;
  }

  getLastMessage() {
    let lastNode = this.head;
    if (lastNode) {
      while (lastNode.next) {
        lastNode = lastNode.next;
      }
    }
    return lastNode;
  }

  getFirstMessage() {
    return this.head;
  }

  addNewMessage(data) {
    this.totalNoMsgs += 1
    data.MsgIndex = this.totalNoMsgs

    let newNode = new MessageNode(data);

    if (!this.head) {
      this.head = newNode;
      return this.head;
    }

    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }

  deleteMessage(id){
    if (this.head.data.id === id) {
      this.head = this.head.next;
    } else {
      let current = this.head;
      while (current.next) {
        if (current.next.data.id === id) {
          current.next = current.next.next;
          break;
        }
        current = current.next;
      }
    }
    return this.head;
  }

  getLastMessage() {
    let current = this.head;

    while (current.next) {
      current = current.next;
    }

    return current.data.content
  }

  getNthMessage(n) {
    n -= 1
    let current = this.head;

    for(var i = 0; i < n; i++){
      if (current){
        current = current.next;
      }else{
        //nth message doesn't exist
        return ""
      }
    }

    return current.data.content
  }

  getNthMessageNode(n) {
    n -= 1
    let current = this.head;

    for(var i = 0; i < n; i++){
      if (current.next){
        current = current.next;
      }else{
        //nth message doesn't exist
        return ""
      }
    }

    if (current){
      return current.data
    }

    return null
  }

  getAllMessagesStringList() {
    let messages = []
    let current = this.head;

    while (current) {
      messages.push(current.data.content)
      current = current.next;
    }

    return messages
  }

  getAllMessagesStringListBySenderId(senderId){
    let messages = []
    let current = this.head;

    while (current) {
      if (current.data.senderId == senderId){
        messages.push(current.data)
      }
      current = current.next;
    }

    return messages
  }

  getOnlyTextMsgsAsNodes(){
    let messages = []
    let current = this.head;

    while (current) {
      if(current.data.msgType == "textMsg"){
        messages.push(current.data)
      }
      current = current.next;
    }

    return messages
  }

  getOnlyCommentsAsNodes(){
    let messages = []
    let current = this.head;

    while (current) {
      if(current.data.msgType == "comment"){
        messages.push(current.data)
      }
      current = current.next;
    }

    return messages
  }

  getCommentByCastIdMsgId(castId, msgId) {
    let allComments = this.getOnlyCommentsAsNodes()

    const result = allComments.find(obj => obj.whoCommentedMsg === castId && obj.idOfMsgCommented === msgId);

    if(result){
      return result.content
    }

    return ''
  }

  getCommentNodeByCastIdMsgId(castId, msgId) {
    let allComments = this.getOnlyCommentsAsNodes()
    return allComments.find(obj => obj.whoCommentedMsg === castId && obj.idOfMsgCommented === msgId);
  }

  editNodeContent(nodeId, newContent){
    let currentNode = this.head;
    while (currentNode) {

      if (currentNode.data.id === nodeId) {
        currentNode.data.content = newContent;
        break;
      }
      currentNode = currentNode.next;
    }

    this.updateScriptFirebase()
  }

  getOnlyLikedMsgsAsNodes(){
    let messages = []
    let current = this.head;

    while (current) {
      if(current.data.msgType == "like"){
        messages.push(current.data)
      }
      current = current.next;
    }

    return messages
  }

  getAllMessagesAsNodes() {
    let messages = []
    let current = this.head;

    while (current) {
      messages.push(current.data)
      current = current.next;
    }

    return messages
  }

  getSenderNameFromID(senderId){
    const mergedArray = this.getAllCast().concat(this.getAllCrew());

    const sender = mergedArray.find(obj => obj.id === senderId);
    if(sender){
      return sender.name
    }else{
      return ""
    }
  }

  sendScriptToFirebase() {
    let script = {
      id: this.id,
      name: this.name,
      dateCreated: this.dateCreated,
      cast: this.getAllCast(),
      crew: this.getAllCrew(),
      messages: this.getAllMessagesAsNodes(),
      scenes: this.getAllScenes(),
      isPrivateScript: this.isPrivateScript,
    }

    firebase.createNewScript(script)
  }

  updateCast(cast){
    this.cast = cast
  }

  updateScene(scenes){
    this.scenes = scenes
  }

  updateScriptFirebase(){
    let script = {
      id: this.id,
      name: this.name,
      dateCreated: this.dateCreated,
      cast: this.getAllCast(),
      crew: this.getAllCrew(),
      messages: this.getAllMessagesAsNodes(),
      scenes: this.getAllScenes(),
      readerReactionMap: JSON.stringify(Object.fromEntries(this.readerReactionMap)),
      isPrivateScript: this.isPrivateScript,
    }

    firebase.updateScript(script)
  }

  removeCast(cast){
    let newCast = []

    this.cast.forEach((existingCast) => {
      if (existingCast.id != cast.id){
        newCast.push(existingCast)
      }
    })

    this.cast = newCast
  }

  addNewCrew(crew){
    this.crew.push(crew)
  }

  getAllCast(){
    return this.cast
  }

  getAllScenes(){
    return this.scenes
  }

  getCastIdToName(){
    const idNameMap = new Map();
    for (const object of this.getAllCast) {
      idNameMap.set(object.id, object.name);
    }
    return idNameMap;
  }

  getAllCrew(){
    return this.crew
  }

  removeCrew(crew){
    let newCrew = []

    this.crew.forEach((existingCrew) => {
      if (existingCrew.id != crew.id){
        newCrew.push(existingCrew)
      }
    })

    this.crew = newCrew
  }

  getScriptName() {
    return this.name;
  }
  
  grabScriptFromFirebase(scriptId){
    return new Promise(resolve => {
      firebase.getScriptById(scriptId)
      .then(val => {

        if(val.messages){
          let messages = val.messages
          for(var i=0; i<messages.length; i++){
            this.addNewMessage(messages[i])
          }
        }

        //grab user reactions
        let readerReactionMap = new Map();
        if(val.readerReactionMap){
          let javascriptObject = JSON.parse(val.readerReactionMap);
          readerReactionMap = new Map(Object.entries(javascriptObject));
        }

        this.name = val.name;
        this.dateCreated = val.dateCreated
        this.id = val.id
        this.cast = val.cast ? val.cast : []
        this.crew = val.crew ? val.crew : []
        this.scenes = val.scenes ? val.scenes : []
        this.readerReactionMap = readerReactionMap
        this.isPrivateScript = val.isPrivateScript ? val.isPrivateScript : false
      })
      .then(() => {
        resolve(this)
      })
    })
  }

  getNodeByMessageId(messageId){
    let currentNode = this.head;
    while (currentNode) {
      if (currentNode.data.id === messageId) {
        return currentNode;
      }
      currentNode = currentNode.next;
    }
    return null;
  }

  getMsgType(messageId){
    let message = getNodeByMessageId(messageId)

    if (message.msgType){
      return message.msgType
    }

    return "textMsg"
  }
}

export default Script;