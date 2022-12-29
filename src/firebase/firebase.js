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
          name: script.name,
          cast: script.cast,
          crew: script.crew,
          messages: script.messages,
          scenes: script.scenes,
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
