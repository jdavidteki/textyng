import firebase from "firebase";

class Firebase {
  saveHeavenData = (heavenId, data, field) => {
    return new Promise((resolve, reject) => {
      const updateObj = {};
      if (field === "heavenData") {
        let parsedContent = data;
        if (typeof data === "string") {
          try {
            parsedContent = JSON.parse(data);
          } catch (error) {
            console.error(`Failed to parse heavenData for ID: ${heavenId}`, error);
            parsedContent = {};
          }
        }
        updateObj[field] = JSON.stringify(parsedContent);
        updateObj.timetravelfile = parsedContent.timetravelfile || null; // Sync timetravelfile
      } else {
        updateObj[field] = data;
      }
      firebase
        .database()
        .ref(`/heavens/${heavenId}`)
        .update(updateObj)
        .then(() => {
          console.log(`Saved ${field} to /heavens/${heavenId}`);
          resolve(true);
        })
        .catch((error) => {
          console.error(`Failed to save ${field} to /heavens/${heavenId}:`, error);
          reject(error);
        });
    });
  };

  getScripts = () => {
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

  getFylds = () => {
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

  createNewHeaven = (heaven) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/heavens/' + heaven.id + '/')
        .set({
          id: heaven.id,
          title: heaven.title,
          dateCreated: heaven.dateCreated,
          scriptId: heaven.scriptId,
          tweets: heaven.tweets || [],
          lines: heaven.lines || [],
          stateSnapshots: heaven.stateSnapshots || [],
          manifestationHistory: heaven.manifestationHistory || [],
          timetravelfile: heaven.timetravelfile || null,
          heavenData: JSON.stringify({
            id: heaven.id,
            title: heaven.title,
            dateCreated: heaven.dateCreated,
            scriptId: heaven.scriptId,
            tweets: heaven.tweets || [],
            lines: heaven.lines || [],
            stateSnapshots: heaven.stateSnapshots || [],
            manifestationHistory: heaven.manifestationHistory || [],
            timetravelfile: heaven.timetravelfile || null,
          }),
        })
        .then(() => {
          console.log("Heaven created");
          resolve(true);
        })
        .catch(error => {
          console.error("Error creating heaven:", error);
          resolve(false);
        });
    });
  };

  updateHeaven = (heaven) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/heavens/' + heaven.id + '/')
        .update({
          id: heaven.id,
          title: heaven.title,
          dateCreated: heaven.dateCreated,
          scriptId: heaven.scriptId,
          tweets: heaven.tweets || [],
          lines: heaven.lines || [],
          stateSnapshots: heaven.stateSnapshots || [],
          manifestationHistory: heaven.manifestationHistory || [],
          timetravelfile: heaven.timetravelfile || null,
          heavenData: JSON.stringify({
            id: heaven.id,
            title: heaven.title,
            dateCreated: heaven.dateCreated,
            scriptId: heaven.scriptId,
            tweets: heaven.tweets || [],
            lines: heaven.lines || [],
            stateSnapshots: heaven.stateSnapshots || [],
            manifestationHistory: heaven.manifestationHistory || [],
            timetravelfile: heaven.timetravelfile || null,
          }),
        })
        .then(() => {
          console.log("Heaven updated");
          resolve(true);
        })
        .catch(error => {
          console.error("Error updating heaven:", error);
          resolve(false);
        });
    });
  };

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

  getRimiSenTitles = () => {
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
      }).catch(error => {
        resolve({})
      })
    })
  }

  storage = () => {
    return firebase.storage()
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

  getHeavenById = (id) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/heavens/'+id)
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            const val = snapshot.val();
            let heavenData = val.heavenData;
            if (typeof heavenData === "string") {
              try {
                heavenData = JSON.parse(heavenData);
              } catch (error) {
                console.error(`Failed to parse heavenData for ID: ${id}`, error);
                heavenData = {};
              }
            }
            resolve({
              id: val.id,
              title: val.title,
              dateCreated: val.dateCreated,
              scriptId: val.scriptId,
              tweets: val.tweets || [],
              lines: val.lines || [],
              stateSnapshots: val.stateSnapshots || [],
              manifestationHistory: val.manifestationHistory || [],
              timetravelfile: val.timetravelfile || null,
              currentGoalInProgress: val.currentGoalInProgress || "",
              ...heavenData,
            });
          } else {
            resolve({});
          }
        });
    });
  };

  updateSenTitle = (update) => {
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
          }).catch( (error) => {
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