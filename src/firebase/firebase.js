import firebase from "firebase";

class Firebase {
  getScripts = () =>{
    return new Promise(resolve => {
      firebase.database()
      .ref('/scripts/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  getFylds = () =>{
    return new Promise(resolve => {
      firebase.database()
      .ref('/fylds/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  createFyld = (fyld) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/fylds/' + fyld.name.replace(/\s/g, '') + '/')
      .set(
        {
          name: fyld.name,
          dateCreated: fyld.dateCreated,
          description: fyld.description,
          image: fyld.image,
          friends: fyld.friends,
        }
      )
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }

  createGrypcht = (grypcht) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/grypchts/' + grypcht.id + '/')
      .set(
        {
          id: grypcht.id,
          groupName: grypcht.groupName,
          members: grypcht.members,
          dateCreated: grypcht.dateCreated,
          description: grypcht.description,
          isPrivateGrypcht: grypcht.isPrivateGrypcht,
        }
      )
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }


  createNewScript = (script) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/scripts/' + script.id + '/')
      .set(
        {
          id: script.id,
          name: script.name,
          dateCreated: script.dateCreated,
          cast: script.cast,
          crew: script.crew,
          messages: script.messages,
          isPrivateScript: script.isPrivateScript,
        }
      )
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }

  updateScript = (script) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/scripts/' + script.id + '/')
      .update(
        {
          id: script.id,
          name: script.name,
          dateCreated: script.dateCreated,
          cast: script.cast,
          crew: script.crew,
          messages: script.messages,
          scenes: script.scenes,
          readerReactionMap: script.readerReactionMap,
          isPrivateScript: script.isPrivateScript,
        }
      )
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }

  getOpenAIAPI = () => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/openAIAPI/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  getConversationHistory = () => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/conversationHistory/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  getRimiSenTitles = () =>{
    return new Promise(resolve => {
      firebase.database()
      .ref('/rimiLyrics/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  postChats = (seller, buyer, message, productId, senderID) => {
    return new Promise(resolve => {
      firebase.database().
      ref('/chats/' + seller + '/' + productId + '/' + buyer + '/').
      push({
        content: message,
        timestamp: Date.now(),
        uid: senderID,
      }).
      then(() => {
        resolve(true)
      }).catch(error =>{
        resolve({})
      })
    })
  }

  storage = () => {
    return firebase.storage()
  }

  getRimiSenTitles = () =>{
    return new Promise(resolve => {
      firebase.database()
      .ref('/rimiLyrics/')
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object.values(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  getScriptById = (id) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/scripts/'+id)
      .once('value')
      .then(snapshot => {
        if (snapshot.val()){
          resolve(Object(snapshot.val()))
        }else{
          resolve({})
        }
      })
    })
  }

  updateSenTitle = (update) =>{
    return new Promise(resolve => {
      firebase.database()
      .ref(`/rimis/${update.id}/`)
      .update(
        {
          senTitle: update.newSenTitle,
        },
      )
      .then((response) => {
        return new Promise(resolve => {
          firebase.database()
          .ref(`/rimis/${update.id}/updates/${update.updateId}`)
          .remove()
          .then(() => {
            resolve(true)
          }).catch( (error) =>{
            console.log("error", error)
          })
        })
        .then((response) => {
          resolve(true)
        })
        .catch(error => {
          console.log("error", error)
        })
      })
      .catch(error => {
        console.log("error", error)
      })
    })

  }

  sendForApproval = (item) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/rimis/'+item.id+'/updates/' + item.updateId + '/')
      .set(item)
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }

  updateVideoSnippetURL = (orderId, snippetVideoURL) => {
    return new Promise(resolve => {
      firebase.database()
      .ref('/orders/' + orderId + '/')
      .update({snippetVideoURL})
      .then((response) => {
        console.log("response", response)
        resolve(true)
      })
      .catch(error => {
        console.log("error", error)
      })
    })
  }
}

export default new Firebase();
