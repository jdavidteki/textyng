"use strict";(self.webpackChunkweb=self.webpackChunkweb||[]).push([[458],{4458:(e,t,n)=>{n.r(t),n.d(t,{default:()=>y});var a=n(2982),r=n(5671),s=n(3144),o=n(7326),i=n(136),c=n(2963),u=n(1120),l=n(4687),f=n.n(l),d=n(9526),p=n(2868),h=n.n(p),m=n(7586);function v(e){var t=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var n,a=(0,u.default)(e);if(t){var r=(0,u.default)(this).constructor;n=Reflect.construct(a,arguments,r)}else n=a.apply(this,arguments);return(0,c.default)(this,n)}}var g=function(e){(0,i.default)(c,e);var t=v(c);function c(e){var n;return(0,r.default)(this,c),(n=t.call(this,e)).state={userInput:"",conversationHistory:[],isTyping:!1},n.handleInputChange=n.handleInputChange.bind((0,o.default)(n)),n.handleSubmit=n.handleSubmit.bind((0,o.default)(n)),n.scrollDown=n.scrollDown.bind((0,o.default)(n)),n}return(0,s.default)(c,[{key:"handleInputChange",value:function(e){this.setState({userInput:e.target.value})}},{key:"handleSubmit",value:function(e){var t,r,s,o,i,c,u,l,d,p,v,g,y,b,w;return f().async((function(C){for(;;)switch(C.prev=C.next){case 0:if(e.preventDefault(),t=this.state.userInput.trim()){C.next=4;break}return C.abrupt("return");case 4:r=[].concat((0,a.default)(this.state.conversationHistory),[{speaker:"user",text:t}]),this.setState({conversationHistory:r,userInput:"",isTyping:!0}),s="",C.prev=7,C.next=27;break;case 11:return o=C.sent,i=Array.isArray(o)?o.join(""):o,C.next=15,f().awrap(m.default.getConversationHistory());case 15:return c=C.sent,u=c.join(""),l=n(4653),d=l.Configuration,p=l.OpenAIApi,delete(v=new d({apiKey:i})).baseOptions.headers["User-Agent"],g=new p(v),C.next=23,f().awrap(g.createCompletion({model:"text-davinci-003",prompt:u+"\nUser: "+t+"\nAI:",max_tokens:150,n:1,stop:["\nUser:","AI:"]}));case 23:y=C.sent,s=y.data.choices[0].text.trim(),C.next=31;break;case 27:return C.next=29,f().awrap(h().post("http://localhost:5000/ask",{inputText:t}));case 29:b=C.sent,s=b.data;case 31:w=[].concat((0,a.default)(this.state.conversationHistory),[{speaker:"ai",text:s}]),this.setState({conversationHistory:w,isTyping:!1},this.scrollDown),C.next=38;break;case 35:C.prev=35,C.t0=C.catch(7),console.log(C.t0);case 38:case"end":return C.stop()}}),null,this,[[7,35]],Promise)}},{key:"scrollDown",value:function(){var e=document.querySelector(".Conversation-history");e.scrollTop=e.scrollHeight}},{key:"oncloseCoonversationClick",value:function(){this.props.oncloseCoonversationClick()}},{key:"render",value:function(){var e=this.state,t=e.conversationHistory,n=e.userInput,a=e.isTyping;return d.createElement("div",{className:"Conversation-container l-container"},d.createElement("div",{className:"Conversation-history"},t.map((function(e,t){return d.createElement("div",{key:t,className:"Conversation-message"},d.createElement("div",{className:"message-text"},e.text))})),a&&d.createElement("div",{className:"Conversation-message ai Conversation-loader"},d.createElement("div",{className:"message-text"},d.createElement("div",{className:"typing-indicator"},d.createElement("span",null),d.createElement("span",null),d.createElement("span",null))))),d.createElement("form",{className:"Conversation-input",onSubmit:this.handleSubmit},d.createElement("input",{type:"text",value:n,onChange:this.handleInputChange}),d.createElement("button",{type:"submit"},"Send")))}}]),c}(d.Component);const y=g},7586:(e,t,n)=>{n.r(t),n.d(t,{default:()=>i});var a=n(3144),r=n(5671),s=n(2805),o=n.n(s);const i=new((0,a.default)((function e(){(0,r.default)(this,e),this.getScripts=function(){return new Promise((function(e){o().database().ref("/scripts/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.getFylds=function(){return new Promise((function(e){o().database().ref("/fylds/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.createFyld=function(e){return new Promise((function(t){o().database().ref("/fylds/"+e.name.replace(/\s/g,"")+"/").set({name:e.name,dateCreated:e.dateCreated,description:e.description,image:e.image,friends:e.friends}).then((function(e){console.log("response",e),t(!0)})).catch((function(e){console.log("error",e)}))}))},this.createGrypcht=function(e){return new Promise((function(t){o().database().ref("/grypchts/"+e.id+"/").set({id:e.id,groupName:e.groupName,members:e.members,dateCreated:e.dateCreated,description:e.description,isPrivateGrypcht:e.isPrivateGrypcht}).then((function(e){console.log("response",e),t(!0)})).catch((function(e){console.log("error",e)}))}))},this.createNewScript=function(e){return new Promise((function(t){o().database().ref("/scripts/"+e.id+"/").set({id:e.id,name:e.name,dateCreated:e.dateCreated,cast:e.cast,crew:e.crew,messages:e.messages,isPrivateScript:e.isPrivateScript}).then((function(e){console.log("response",e),t(!0)})).catch((function(e){console.log("error",e)}))}))},this.updateScript=function(e){return new Promise((function(t){o().database().ref("/scripts/"+e.id+"/").update({id:e.id,name:e.name,dateCreated:e.dateCreated,cast:e.cast,crew:e.crew,messages:e.messages,scenes:e.scenes,readerReactionMap:e.readerReactionMap,isPrivateScript:e.isPrivateScript}).then((function(e){console.log("response",e),t(!0)})).catch((function(e){console.log("error",e)}))}))},this.getOpenAIAPI=function(){return new Promise((function(e){o().database().ref("/openAIAPI/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.getConversationHistory=function(){return new Promise((function(e){o().database().ref("/conversationHistory/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.getRimiSenTitles=function(){return new Promise((function(e){o().database().ref("/rimiLyrics/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.postChats=function(e,t,n,a,r){return new Promise((function(s){o().database().ref("/chats/"+e+"/"+a+"/"+t+"/").push({content:n,timestamp:Date.now(),uid:r}).then((function(){s(!0)})).catch((function(e){s({})}))}))},this.storage=function(){return o().storage()},this.getRimiSenTitles=function(){return new Promise((function(e){o().database().ref("/rimiLyrics/").once("value").then((function(t){t.val()?e(Object.values(t.val())):e({})}))}))},this.getScriptById=function(e){return new Promise((function(t){o().database().ref("/scripts/"+e).once("value").then((function(e){e.val()?t(Object(e.val())):t({})}))}))},this.updateSenTitle=function(e){return new Promise((function(t){o().database().ref("/rimis/"+e.id+"/").update({senTitle:e.newSenTitle}).then((function(n){return new Promise((function(t){o().database().ref("/rimis/"+e.id+"/updates/"+e.updateId).remove().then((function(){t(!0)})).catch((function(e){console.log("error",e)}))})).then((function(e){t(!0)})).catch((function(e){console.log("error",e)}))})).catch((function(e){console.log("error",e)}))}))},this.sendForApproval=function(e){return new Promise((function(t){o().database().ref("/rimis/"+e.id+"/updates/"+e.updateId+"/").set(e).then((function(e){console.log("response",e),t(!0)})).catch((function(e){console.log("error",e)}))}))},this.updateVideoSnippetURL=function(e,t){return new Promise((function(n){o().database().ref("/orders/"+e+"/").update({snippetVideoURL:t}).then((function(e){console.log("response",e),n(!0)})).catch((function(e){console.log("error",e)}))}))}})))}}]);
//# sourceMappingURL=458.175d5667.chunk.js.map