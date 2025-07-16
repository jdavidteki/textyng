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
        updateObj.timetravelfile = parsedContent.timetravelfile || null;
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
          if (snapshot.val()) {
            resolve(Object.values(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  getFylds = () => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/fylds/')
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            resolve(Object.values(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  createFyld = (fyld) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/fylds/' + fyld.name.replace(/\s/g, '') + '/')
        .set({
          name: fyld.name,
          dateCreated: fyld.dateCreated,
          description: fyld.description,
          image: fyld.image,
          friends: fyld.friends,
        })
        .then(() => {
          console.log("Fyld created");
          resolve(true);
        })
        .catch(error => {
          console.log("Error creating fyld:", error);
          resolve(false);
        });
    });
  };

  createGrypcht = (grypcht) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/grypchts/' + grypcht.id + '/')
        .set({
          id: grypcht.id,
          groupName: grypcht.groupName,
          members: grypcht.members,
          dateCreated: grypcht.dateCreated,
          description: grypcht.description,
          isPrivateGrypcht: grypcht.isPrivateGrypcht,
        })
        .then(() => {
          console.log("Grypcht created");
          resolve(true);
        })
        .catch(error => {
          console.log("Error creating grypcht:", error);
          resolve(false);
        });
    });
  };

  createNewScript = (script) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/scripts/' + script.id + '/')
        .set({
          id: script.id,
          name: script.name,
          dateCreated: script.dateCreated,
          cast: script.cast,
          crew: script.crew,
          messages: script.messages,
          isPrivateScript: script.isPrivateScript,
        })
        .then(() => {
          console.log("Script created");
          resolve(true);
        })
        .catch(error => {
          console.log("Error creating script:", error);
          resolve(false);
        });
    });
  };

  updateScript = (script) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/scripts/' + script.id + '/')
        .update({
          id: script.id,
          name: script.name,
          dateCreated: script.dateCreated,
          cast: script.cast,
          crew: script.crew,
          messages: script.messages,
          scenes: script.scenes,
          readerReactionMap: script.readerReactionMap,
          isPrivateScript: script.isPrivateScript,
        })
        .then(() => {
          console.log("Script updated");
          resolve(true);
        })
        .catch(error => {
          console.log("Error updating script:", error);
          resolve(false);
        });
    });
  };

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
    return new Promise((resolve, reject) => {
      firebase
        .database()
        .ref('/heavens/' + heaven.id + '/')
        .update({
          title: heaven.title || 'Untitled Heaven',
          dateCreated: heaven.dateCreated || Math.floor(Date.now() / 1000),
          scriptId: heaven.scriptId || null,
          tweets: heaven.tweets || [],
          lines: heaven.lines || {},
          stateSnapshots: heaven.stateSnapshots || [],
          manifestationHistory: heaven.manifestationHistory || [],
          timetravelfile: heaven.timetravelfile || null,
        })
        .then(() => {
          console.debug(`Heaven ${heaven.id} updated successfully:`, {
            manifestationHistory: heaven.manifestationHistory,
          });
          resolve(true);
        })
        .catch((error) => {
          console.error(`Error updating heaven ${heaven.id}:`, error);
          reject(error);
        });
    });
  };

  getHeavenById = (heavenId) => {
    return new Promise((resolve, reject) => {
      firebase
        .database()
        .ref('/heavens/' + heavenId)
        .once('value')
        .then((snapshot) => {
          const data = snapshot.val();
          console.debug(`Raw Firebase data for heaven ${heavenId}:`, data);
          resolve(data);
        })
        .catch((error) => {
          console.error(`Error fetching heaven ${heavenId}:`, error);
          reject(error);
        });
    });
  };

  getOpenAIAPI = () => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/openAIAPI/')
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            resolve(Object.values(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  getConversationHistory = () => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/conversationHistory/')
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            resolve(Object.values(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  getRimiSenTitles = () => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/rimiLyrics/')
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            resolve(Object.values(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  postChats = (seller, buyer, message, productId, senderID) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/chats/' + seller + '/' + productId + '/' + buyer + '/')
        .push({
          content: message,
          timestamp: Date.now(),
          uid: senderID,
        })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          resolve({});
        });
    });
  };

  saveStateUpdateCommands = (heavenId, command, timestamp) => {
    return new Promise(resolve => {
      const commandHistoryRef = firebase.database().ref(`/heavens/${heavenId}/commandHistory`);
      const formattedCommand = `[${timestamp}]:${command};`;

      commandHistoryRef
        .transaction(currentHistory => {
          return currentHistory ? `${currentHistory}${formattedCommand}` : formattedCommand;
        })
        .then(result => {
          if (!result.committed) {
            resolve({});
            return;
          }
          console.debug(`Concatenated command "${command}" to /heavens/${heavenId}/commandHistory`);
          resolve(true);
        })
        .catch(error => {
          console.error("Failed to save command to Firebase:", error);
          resolve({});
        });
    });
  }

  storage = () => {
    return firebase.storage();
  };

  getScriptById = (id) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/scripts/' + id)
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            resolve(Object(snapshot.val()));
          } else {
            resolve({});
          }
        });
    });
  };

  getHeavenById = (id) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/heavens/' + id)
        .once('value')
        .then(snapshot => {
          if (snapshot.val()) {
            const val = snapshot.val();
            let heavenData = val.heavenData || {};
            if (typeof heavenData === "string") {
              try {
                heavenData = JSON.parse(heavenData);
              } catch (error) {
                console.error(`Failed to parse heavenData for ID: ${id}`, error);
                heavenData = {};
              }
            }
            const resolvedData = {
              ...heavenData,
              id: val.id || id,
              title: val.title || "Untitled Heaven",
              dateCreated: val.dateCreated || Math.floor(Date.now() / 1000),
              scriptId: val.scriptId || null,
              tweets: val.tweets || [],
              lines: val.lines || [],
              stateSnapshots: val.stateSnapshots || [],
              manifestationHistory: val.manifestationHistory || [],
              timetravelfile: val.timetravelfile || null,
              currentGoalInProgress: val.currentGoalInProgress !== undefined ? val.currentGoalInProgress : null,
            };
            resolve(resolvedData);
          } else {
            console.warn(`No data found for heaven ${id}`);
            resolve({});
          }
        })
        .catch(error => {
          console.error(`Firebase fetch error for heaven ${id}:`, error);
          resolve({});
        });
    });
  };

  getMoveHistory = (heavenId, limit = 50) => {
    return new Promise((resolve, reject) => {
      firebase.database()
        .ref(`/heavens/${heavenId}/commandHistory`)
        .once('value')
        .then(snapshot => {
          const commandHistory = snapshot.val() || '';

          const entries = [];
          const seen = new Set(); // Track command-timestamp pairs to avoid duplicates
          const regex = /\[(\d+)\]:(.*?)(?=\[\d+\]:|$)/g;
          let match;
          while ((match = regex.exec(commandHistory)) !== null) {
            const timestamp = parseInt(match[1], 10);
            const commandSegment = match[2].trim();
            const individualCommands = commandSegment.split(';').filter(cmd => cmd.trim());
            individualCommands.forEach((cmd, cmdIndex) => {
              const cleanCommand = cmd.trim();
              if (cleanCommand.match(/^(\w+\.\w+\(.*\);?)$/)) {
                const key = `${cleanCommand}|${timestamp + cmdIndex}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  entries.push({
                    command: cleanCommand,
                    timestamp: timestamp + cmdIndex,
                  });
                }
              }
            });
          }

          const history = entries
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-limit);
          resolve(history);
        })
        .catch(error => {
          console.error("Failed to fetch move history:", error);
          firebase.database()
            .ref('/errors/')
            .push({
              type: "FirebaseFetchError",
              message: `Failed to fetch move history: ${error.message}`,
              heavenId,
              timestamp: Date.now(),
            })
            .catch(err => console.error("Failed to log Firebase error:", err));
          reject(error);
        });
    });
  }


  updateSenTitle = (update) => {
    return new Promise(resolve => {
      firebase.database()
        .ref(`/rimis/${update.id}/`)
        .update({
          senTitle: update.newSenTitle,
        })
        .then(() => {
          return firebase.database()
            .ref(`/rimis/${update.id}/updates/${update.updateId}`)
            .remove();
        })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          console.log("Error updating senTitle:", error);
          resolve(false);
        });
    });
  };

  sendForApproval = (item) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/rimis/' + item.id + '/updates/' + item.updateId + '/')
        .set(item)
        .then(() => {
          console.log("Item sent for approval");
          resolve(true);
        })
        .catch(error => {
          console.log("Error sending for approval:", error);
          resolve(false);
        });
    });
  };

  updateVideoSnippetURL = (orderId, snippetVideoURL) => {
    return new Promise(resolve => {
      firebase.database()
        .ref('/orders/' + orderId + '/')
        .update({ snippetVideoURL })
        .then(() => {
          console.log("Video snippet URL updated");
          resolve(true);
        })
        .catch(error => {
          console.log("Error updating video snippet URL:", error);
          resolve(false);
        });
    });
  };

  updateHeavenField = (heavenId, field, value) => {
    return new Promise((resolve, reject) => {
      const updateObj = { [field]: value };
      firebase
        .database()
        .ref(`/heavens/${heavenId}`)
        .update(updateObj)
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          console.error(`Failed to update ${field} for heaven ${heavenId}:`, error);
          reject(error);
        });
    });
  };

  logError = (errorData) => {
    return new Promise((resolve, reject) => {
      firebase
        .database()
        .ref('/errors/')
        .push(errorData)
        .then(() => {
          console.log("Error logged to Firebase");
          resolve(true);
        })
        .catch(error => {
          console.error("Failed to log error to Firebase:", error);
          reject(error);
        });
    });
  };
}

export default new Firebase();