import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import EditScript from "../EditScript/EditScript.js";
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import Firebase from "../../firebase/firebase.js";
import { saveAs } from 'file-saver';

import "./CustomerWorkstation.css";

function getHeavenData(props) {
  try {
    if (props?.location?.state?.updatedHeaven) {
      return props.location.state.updatedHeaven;
    }
    return require('./heavenFromAI.json');
  } catch (err) {
    console.error('Failed to load heaven data:', err);
    return null;
  }
}

function saveHeavenData(data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'heavenFromAI.json');
    return true;
  } catch (err) {
    console.error('Failed to save heaven data to file:', err);
    return false;
  }
}

class CustomerWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heavenData: getHeavenData(props),
      script: null,
      selectedGoalId: null,
      selectedCharacter: null,
      selectedObject: null,
      manifestationActions: [],
      manifestationHistory: [],
      isValidating: false,
      allMessages: [],
      selectedCastId: null,
      selectedSceneId: null,
      cast: [],
      scenes: [],
      lastProcessedMessageId: null,
      stateSnapshots: [],
      activeAction: null,
    };
    this.saveInterval = null;
  }

  async componentDidMount() {
    const { heavenData } = this.state;
    if (heavenData) {
      try {
        const script = new Script(heavenData.script.title);
        if (heavenData.script.messages) {
          heavenData.script.messages.forEach(msg => script.addNewMessage(msg));
        }
        if (heavenData.script.cast) script.updateCast(heavenData.script.cast);
        if (heavenData.script.scenes) script.updateScene(heavenData.script.scenes);
        if (heavenData.stateSnapshots) this.setState({ stateSnapshots: heavenData.stateSnapshots });
        if (heavenData.manifestationHistory) this.setState({ manifestationHistory: heavenData.manifestationHistory });

        // Create or update scenes based on unique places from lines
        const placeToScene = {};
        const scenes = heavenData.script.scenes || [];
        heavenData.lines.forEach((line, index) => {
          const place = line.place || "default";
          if (!placeToScene[place] && !scenes.find(s => s.name === place)) {
            const sceneId = `scene-${scenes.length + 1}`;
            placeToScene[place] = sceneId;
            scenes.push({
              id: sceneId,
              name: place,
            });
          }
        });

        script.updateScene(scenes);
        this.setState({
          script,
          cast: heavenData.script.cast || [],
          scenes,
          allMessages: script.getAllMessagesAsNodes(),
          stateSnapshots: heavenData.stateSnapshots || [],
          manifestationHistory: heavenData.manifestationHistory || [],
        });
      } catch (err) {
        console.error('Script initialization error:', err);
      }
    }
  }

  componentWillUnmount() {
    if (this.saveInterval) clearInterval(this.saveInterval);
  }

  componentDidUpdate(prevProps, prevState) {
    const { script, selectedGoalId, allMessages } = this.state;
    if (selectedGoalId != null && script) {
      const currentMessages = script.getAllMessagesAsNodes();
      if (currentMessages.length > allMessages.length) {
        const newMessages = currentMessages.slice(allMessages.length);
        newMessages.forEach(message => {
          if (!this.state.lastProcessedMessageId || message.id > this.state.lastProcessedMessageId) {
            this.validateScriptMessage(message);
            this.setState({ lastProcessedMessageId: message.id });
          }
        });
        this.setState({ allMessages: currentMessages });
      }
    }
  }

  handleGoalSelect = (goalId) => {
    const { heavenData } = this.state;
    if (!heavenData || !heavenData.lines[goalId]) return;
    const line = heavenData.lines[goalId];
    const place = line.place || "default";
    const sceneId = this.state.scenes.find(scene => scene.name === place)?.id || this.state.scenes[0]?.id;
    const selectedCharacter = heavenData.characters?.[0]?.name || null;
    const selectedObject = line.objectStates?.[0] || null;
    this.setState({
      selectedGoalId: goalId,
      selectedSceneId: sceneId,
      selectedCharacter,
      selectedObject,
      manifestationActions: [],
      activeAction: null,
    });
  };

  handleCloseGoalSection = () => {
    this.setState({
      selectedGoalId: null,
      selectedCharacter: null,
      selectedObject: null,
      manifestationActions: [],
      activeAction: null,
    });
  };

  validateScriptMessage = async (message) => {
    const { script, selectedGoalId, heavenData } = this.state;
    if (selectedGoalId == null) return;

    const line = heavenData.lines[selectedGoalId];
    const sceneId = this.state.scenes.find(scene => scene.name === line.place)?.id || this.state.scenes[0]?.id;
    const msgData = {
      id: message.id,
      timeStamp: message.timeStamp,
      content: message.content,
      emotion: message.emotion || line.primaryEmotion,
      senderId: message.senderId,
      tslmsg: message.tslmsg || 0,
      msgType: message.msgType || "textMsg",
      sceneId: message.sceneId || sceneId,
      thrydId: selectedGoalId,
      character: script.getSenderNameFromID(message.senderId),
      isImg: message.isImg || false,
      url: message.url || null,
    };

    const isValid = await this.performOpenAIValidation(msgData, line);
    if (isValid) {
      this.setState(prev => ({
        manifestationActions: [
          ...prev.manifestationActions,
          {
            type: msgData.msgType === "textMsg" ? "dialogue" : msgData.isImg ? "media" : "action",
            character: msgData.character,
            content: msgData.content,
            url: msgData.url,
            save: false,
          }
        ],
        allMessages: script.getAllMessagesAsNodes(),
      }));
    } else {
      alert('Message does not align with the goal or place. Please adjust.');
    }
  };

  performOpenAIValidation = async (msgData, line) => {
    try {
      const openAIAPI = await Firebase.getOpenAIAPI();
      const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at evaluating dialogue in a time-travel narrative. Given a goal, its emotions, place, and state snapshots, assess if a character's message is logically plausible and aligns with the goal's context and place. Return {"response": "accept"} if plausible (>0.7), else {"response": "decline", "reason": "explanation"}.`,
          },
          {
            role: 'user',
            content: `Goal: "${line.text}"
                      Emotion: ${line.primaryEmotion} (${line.secondaryEmotion})
                      Place: ${line.place || 'default'}
                      State Snapshots: ${JSON.stringify(this.state.stateSnapshots, null, 2)}

                      Character: ${msgData.character}
                      Message: "${msgData.content}"
                      Message Emotion: ${msgData.emotion}

                      Evaluate if this message aligns with the goal's emotion, context, place, and state snapshots. Return a JSON object with "response" and optional "reason".`,
          },
        ],
        temperature: 0.5,
      };

      const gptResponse = await openai.chat.completions.create(payload);
      const aiResponse = gptResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(aiResponse);
      return parsed.response === 'accept';
    } catch (error) {
      console.error('Error validating script message:', error);
      return false;
    }
  };

  manifest = async () => {
    const { heavenData, selectedGoalId, script, stateSnapshots } = this.state;
    if (!selectedGoalId) {
      alert('Please select a goal.');
      return;
    }

    const line = heavenData.lines[selectedGoalId];
    const messages = script.getAllMessagesAsNodes();

    this.setState({ isValidating: true });

    try {
      const openAIAPI = await Firebase.getOpenAIAPI();
      const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at determining if a goal manifests in a time-travel narrative. Given a goal (narrative line), all prior messages, past state snapshots, and the place, assess the probability of the goal manifesting based on the accumulated context. Return {"response": "accept"} if the probability exceeds 0.7, else {"response": "decline", "reason": "explanation"}.`,
          },
          {
            role: 'user',
            content: `Goal: "${line.text}"
                      Emotion: ${line.primaryEmotion} (${line.secondaryEmotion})
                      Place: ${line.place || 'default'}
                      State Snapshots: ${JSON.stringify(stateSnapshots, null, 2)}
                      Messages: ${JSON.stringify(messages, null, 2)}

                      Evaluate if this goal manifests based on the prior messages and state snapshots. Return a JSON object with "response" and optional "reason".`,
          },
        ],
        temperature: 0.5,
      };

      const gptResponse = await openai.chat.completions.create(payload);
      const aiResponse = gptResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(aiResponse);

      if (parsed.response === 'accept') {
        await this.saveStateToJson();
        this.setState(prev => ({
          manifestationHistory: [
            ...prev.manifestationHistory,
            {
              goalId: selectedGoalId,
              actions: prev.manifestationActions,
              timestamp: Math.floor(Date.now() / 1000),
            }
          ],
          selectedGoalId: null,
          selectedCharacter: null,
          selectedObject: null,
          manifestationActions: [],
          selectedCastId: null,
          selectedSceneId: null,
          activeAction: null,
        }));
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
        });
        alert('Goal has manifested! Select your next goal to continue your journey.');
      } else {
        alert(`Goal did not manifest: ${parsed.reason}`);
      }
      this.setState({ isValidating: false, activeAction: null });
    } catch (error) {
      console.error('Error manifesting goal:', error);
      alert('Failed to manifest goal.');
      this.setState({ isValidating: false, activeAction: null });
    }
  };

  saveStateToJson = async () => {
    const { heavenData, script, stateSnapshots, manifestationHistory } = this.state;
    const newHeavenData = {
      ...heavenData,
      script: {
        title: script.getScriptName(),
        messages: script.getAllMessagesAsNodes(),
        cast: script.getAllCast(),
        scenes: script.getAllScenes(),
      },
      stateSnapshots,
      manifestationHistory,
    };

    if (saveHeavenData(newHeavenData)) {
      this.setState({ heavenData: newHeavenData });
    }
  };

  saveScriptToJson = async () => {
    const { heavenData, script, stateSnapshots, manifestationHistory } = this.state;
    const newHeavenData = {
      ...heavenData,
      script: {
        title: script.getScriptName(),
        messages: script.getAllMessagesAsNodes(),
        cast: script.getAllCast(),
        scenes: script.getAllScenes(),
      },
      stateSnapshots,
      manifestationHistory,
    };
    saveHeavenData(newHeavenData);
  };

  saveStateToFile = async () => {
    const { heavenData, script, stateSnapshots, manifestationHistory } = this.state;
    const newHeavenData = {
      ...heavenData,
      script: {
        title: script.getScriptName(),
        messages: script.getAllMessagesAsNodes(),
        cast: script.getAllCast(),
        scenes: script.getAllScenes(),
      },
      stateSnapshots,
      manifestationHistory,
    };
    saveHeavenData(newHeavenData);
  };

  render() {
    const {
      heavenData,
      script,
      selectedGoalId,
      selectedCharacter,
      selectedObject,
      manifestationActions,
      isValidating,
      allMessages,
      cast,
      scenes,
      activeAction,
    } = this.state;

    if (!heavenData || !script || !cast || !scenes) {
      return <div className="CustomerWorkstation--loading-message">Loading your journey...</div>;
    }

    return (
      <div className="CustomerWorkstation">
        <FormControl className="CustomerWorkstation--goal-select">
          <InputLabel>Select Your Goal</InputLabel>
          <Select
            value={selectedGoalId ?? ''}
            onChange={(e) => this.handleGoalSelect(e.target.value === '' ? null : parseInt(e.target.value))}
          >
            <MenuItem value="">Select a goal</MenuItem>
            {heavenData.lines.map((line, index) => (
              <MenuItem key={`goal-${index}`} value={index}>
                {line.text} ({line.place || 'default'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedGoalId != null && (
          <div className="CustomerWorkstation--goal-section">
            <Button
              variant="outlined"
              onClick={this.handleCloseGoalSection}
              className="CustomerWorkstation--close-button"
            >
              X
            </Button>
            <p className="CustomerWorkstation--place-info">
              Place: {heavenData.lines[selectedGoalId].place || 'default'}
            </p>
            <p className="CustomerWorkstation--character-object-info">
              Character: {selectedCharacter || 'None'} | Object: {selectedObject || 'None'}
            </p>
            {activeAction === null && (
              <div className="CustomerWorkstation--button-group">
                <Button
                  variant="contained"
                  onClick={() => this.setState({ activeAction: 'manifest' })}
                >
                  Manifest
                </Button>
                <Button
                  variant="contained"
                  onClick={() => this.saveScriptToJson()}
                >
                  Save to File
                </Button>
              </div>
            )}
            {activeAction === 'manifest' && (
              <div className="CustomerWorkstation--manifest-buttons">
                <Button
                  variant="contained"
                  onClick={this.manifest}
                  disabled={isValidating}
                >
                  {isValidating ? 'Manifesting...' : 'Confirm'}
                </Button>
                <Button
                  variant="contained"
                  onClick={this.saveStateToFile}
                >
                  Save State
                </Button>
                <Button
                  variant="contained"
                  onClick={() => this.setState({ activeAction: null })}
                >
                  Back
                </Button>
              </div>
            )}

            <div className="CustomerWorkstation--chat-area">
              {allMessages
                .filter(msg => msg.sceneId === this.state.selectedSceneId)
                .map((message, index) => (
                  <div key={`msg-${index}`} className="CustomerWorkstation--message">
                    <strong>{message.character || script.getSenderNameFromID(message.senderId)}:</strong> {message.content}
                    {message.isImg && (
                      <img src={message.url} alt="Screenshot" className="CustomerWorkstation--message-image" />
                    )}
                    {message.emotion && <span className="CustomerWorkstation--message-emotion"> ({message.emotion})</span>}
                    {message.object && <span className="CustomerWorkstation--message-object"> [Object: {message.object}]</span>}
                  </div>
                ))}
            </div>

            <div className="CustomerWorkstation--actions-section">
              <h4 className="CustomerWorkstation--actions-title">Manifestation Actions</h4>
              {manifestationActions.length === 0 && (
                <p className="CustomerWorkstation--no-actions">No actions added yet.</p>
              )}
              <ul className="CustomerWorkstation--actions-list">
                {manifestationActions.map((action, index) => (
                  <li key={`action-${index}`} className="CustomerWorkstation--action-item">
                    <input
                      type="checkbox"
                      checked={action.save}
                      onChange={() => {
                        const newActions = [...this.state.manifestationActions];
                        newActions[index].save = !newActions[index].save;
                        this.setState({ manifestationActions: newActions });
                      }}
                      className="CustomerWorkstation--action-checkbox"
                    />
                    <span className="CustomerWorkstation--action-text">
                      {action.type === 'dialogue'
                        ? `${action.character} says: "${action.content}"`
                        : action.type === 'media'
                        ? `${action.character} shares: ${action.content}`
                        : `${action.character} performs: ${action.method}(${action.args?.join(', ')})`}
                    </span>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const newActions = [...this.state.manifestationActions];
                        newActions.splice(index, 1);
                        this.setState({ manifestationActions: newActions });
                      }}
                      className="CustomerWorkstation--remove-button"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <EditScript isNewScript={true} script={script} />
      </div>
    );
  }
}

export default withRouter(CustomerWorkstation);