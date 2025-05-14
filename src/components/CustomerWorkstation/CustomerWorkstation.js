import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import EditScript from "../EditScript/EditScript.js";
import confetti from 'canvas-confetti';
import Firebase from "../../firebase/firebase.js";
import Heaven from "../Heaven/Heaven.js";
import GoalManager from "./GoalManager.js";
import { GENERATE_TIME_TRAVEL_PROMPT, MANIFEST_PROMPT, DEFAULT_TIME_TRAVEL_CODE } from "./prompts.js";

import "./CustomerWorkstation.css";

// Utility to load fallback heaven data
function getFallbackHeavenData() {
  try {
    return require('./heavenFromAI.json');
  } catch (err) {
    console.error('Failed to load fallback heaven data:', err);
    return null;
  }
}

// Utility to save data to Realtime Database
async function saveHeavenData(data, filename = 'heavenFromAI.json', heavenId) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const field = filename === 'timetravel.js' ? 'timetravelfile' : 'heavenData';

  try {
    await Firebase.saveHeavenData(heavenId, content, field);
    console.log(`Saved ${filename} to Realtime Database at /heavens/${heavenId}/${field}`);
    return true;
  } catch (err) {
    console.error(`Failed to save ${filename} to Realtime Database:`, err);
    return false;
  }
}

// Utility to strip Markdown code fences, hidden characters, and normalize code
function stripCodeFences(code) {
  if (!code || typeof code !== 'string') return '';
  let cleaned = code.replace(/^\uFEFF/, '') // Remove BOM
                    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII
                    .replace(/\r\n|\r/g, '\n') // Normalize to \n
                    .replace(/^\s*```(?:\w+)?\s*?\n?([\s\S]*?)\n?\s*```?\s*$/, '$1') // Remove code fences
                    .replace(/^\s*```.*$/gm, '') // Remove stray ``` lines
                    .trim();
  if (cleaned.match(/export default .*$/)) {
    cleaned = cleaned.replace(/export default ([^;]*)$/, 'export default $1;');
  }
  return cleaned;
}

// Utility to get OpenAI instance
let openAIInstance = null;
async function getOpenAIInstance() {
  if (openAIInstance) return openAIInstance;
  try {
    const openAIAPI = await Firebase.getOpenAIAPI();
    const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
    const OpenAI = require('openai');
    openAIInstance = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });
    return openAIInstance;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    throw error;
  }
}

class ConnectedCustomerWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heaven: null,
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
      stateSnapshots: [],
      activeAction: null,
      timeTravelCode: null,
      timeMachineDestination: null,
      movementHistory: [],
      heavenId: null,
      loadingProgress: 0,
    };
    this.saveInterval = null;
  }

  async componentDidMount() {
    const heavenId = this.props.match.params.id || null;
    this.setState({ heavenId, loadingProgress: 10 });

    let heaven;
    try {
      heaven = await Heaven.create(heavenId, getFallbackHeavenData());
      this.setState({ loadingProgress: 30 });
      this.setState({ heaven, loadingProgress: 50 });

    } catch (error) {
      console.error(`Error initializing Heaven for ID: ${heavenId || 'fallback'}:`, error);
      heaven = await Heaven.create(null, getFallbackHeavenData());
      this.setState({ loadingProgress: 30 });
      this.setState({ heaven, loadingProgress: 50 });
      console.log("Heaven initialized (fallback):", heaven);
      console.log("Heaven script (fallback):", heaven.script);
    }

    let timeTravelCode = heaven.getTimeTravelFile();
    this.setState({ loadingProgress: 60 });

    if (timeTravelCode && typeof timeTravelCode === 'string') {
      try {
        const scriptFunction = new Function(timeTravelCode + '; return ThrydObjects;');
        const ThrydObjects = scriptFunction();
        if (ThrydObjects && typeof ThrydObjects.initiateThrydObjectsAndExecuteMovement === 'function') {
          const movementResults = ThrydObjects.initiateThrydObjectsAndExecuteMovement();
          const destination = ThrydObjects.timeMachine.getDestination();
          const history = ThrydObjects.getHistory();
          this.setState({
            timeTravelCode,
            timeMachineDestination: destination,
            movementHistory: history,
          });
          console.log('Time machine destination:', destination);
          console.log('Movement history:', history);
        } else {
          console.error('ThrydObjects or initiateThrydObjectsAndExecuteMovement is invalid');
          timeTravelCode = null;
        }
      } catch (err) {
        console.error('Error executing timetravelfile:', err);
        timeTravelCode = null;
      }
    } else {
      console.warn('No valid timetravelfile in heaven data');
    }

    if (!timeTravelCode) {
      console.log('Attempting to generate timetravel.js...');
      await this.generateTimeTravelFile();
      timeTravelCode = this.state.timeTravelCode;
      if (!timeTravelCode) {
        console.warn('Failed to generate timetravel.js. A default timetravel.js has been saved to Realtime Database.');
        alert(
          `Failed to load or generate timetravel.js. A default timetravel.js has been saved to Realtime Database at /heavens/${heavenId}/timetravelfile.`
        );
      }
    }
    this.setState({ loadingProgress: 80 });

    const script = heaven.getScript();
    if (script && heaven.getAllData()) {
      try {
        this.setState({
          script,
          cast: heaven.getCharacters() || [],
          scenes: script.getScenes() || [],
          allMessages: script.getAllMessagesAsNodes(),
          stateSnapshots: heaven.getAllData().stateSnapshots || [],
          manifestationHistory: heaven.getAllData().manifestationHistory || [],
          loadingProgress: 100,
        });
      } catch (err) {
        console.error('Script initialization error:', err);
        this.setState({ loadingProgress: 100 });
      }
    } else {
      this.setState({ loadingProgress: 100 });
    }
  }

  async generateTimeTravelFile() {
    const { heaven, heavenId } = this.state;
    if (!heaven) {
      console.error('No heaven available to generate timetravel.js');
      alert('No heaven available. A default timetravel.js has been saved to Realtime Database.');
      await this.createDefaultTimeTravelFile();
      return;
    }

    try {
      const openai = await getOpenAIInstance();

      const prompt = GENERATE_TIME_TRAVEL_PROMPT.replace('{{JSON_DATA}}', JSON.stringify(heaven.getAllData(), null, 2));

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a JavaScript and narrative design expert. Generate syntactically correct JavaScript code adhering to the provided requirements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      };

      let timeTravelCode = null;
      try {
        const startTime = Date.now();
        const gptResponse = await openai.chat.completions.create(payload);

        if (!gptResponse.choices?.[0]?.message?.content) {
          throw new Error('Empty or invalid OpenAI response');
        }

        timeTravelCode = stripCodeFences(gptResponse.choices[0].message.content);
        console.log('Cleaned timeTravelCode:', timeTravelCode);

        if (!timeTravelCode) {
          throw new Error('No valid code after stripping fences');
        }

        const esprima = require('esprima');
        try {
          esprima.parseModule(timeTravelCode);
        } catch (parseError) {
          console.error('Esprima parsing failed:', parseError);
          let fixedCode = timeTravelCode;
          if (!fixedCode.endsWith(';')) {
            fixedCode += ';';
          }
          try {
            esprima.parseModule(fixedCode);
            console.log('Fixed code by adding semicolon');
            timeTravelCode = fixedCode;
          } catch (fixError) {
            console.error('Fix attempt failed:', fixError);
            throw parseError;
          }
        }
      } catch (error) {
        console.error('Error processing OpenAI response:', error);
        if (timeTravelCode) {
          console.log('Invalid timeTravelCode content:');
          timeTravelCode.split('\n').forEach((line, index) => {
            console.log(`Line ${index + 1}: ${line}`);
          });
        }
        timeTravelCode = null;
      }

      if (timeTravelCode) {
        const existingTimeTravelFile = heaven.getTimeTravelFile();
        if (existingTimeTravelFile === timeTravelCode) {
          console.log('Generated timetravel.js is identical to existing file, skipping Firebase save.');
          this.setState({ timeTravelCode });
        } else {
          this.setState({ timeTravelCode });
          await heaven.setTimeTravelFile(timeTravelCode);
          console.log('timetravel.js generated and saved to Realtime Database.');
          alert(`timetravel.js generated and saved to Realtime Database at /heavens/${heavenId}/timetravelfile.`);
        }
      } else {
        console.error('Failed to generate valid timetravel.js from OpenAI');
        await this.createDefaultTimeTravelFile();
      }
    } catch (error) {
      console.error('Error generating timetravel.js with OpenAI:', error);
      await this.createDefaultTimeTravelFile();
    }
  }

  async createDefaultTimeTravelFile() {
    const { heaven, heavenId } = this.state;
    const defaultTimeTravelCode = DEFAULT_TIME_TRAVEL_CODE;

    const existingTimeTravelFile = heaven.getTimeTravelFile();
    if (existingTimeTravelFile === defaultTimeTravelCode) {
      console.log('Default timetravel.js is identical to existing file, skipping Firebase save.');
      this.setState({ timeTravelCode: defaultTimeTravelCode });
    } else {
      this.setState({ timeTravelCode: defaultTimeTravelCode });
      await heaven.setTimeTravelFile(defaultTimeTravelCode);
      console.log('Default timetravel.js saved to Realtime Database.');
      alert(`Default timetravel.js saved to Realtime Database at /heavens/${heavenId}/timetravelfile.`);
    }
  }

  componentWillUnmount() {
    if (this.saveInterval) clearInterval(this.saveInterval);
  }

  componentDidUpdate(prevProps, prevState) {
    const { script, selectedGoalId, allMessages } = this.state;
    if (selectedGoalId !== null && script) {
      const currentMessages = script.getAllMessagesAsNodes();
      if (currentMessages.length > allMessages.length) {
        this.setState({ allMessages: currentMessages });
      }
    }
  }

  handleGoalSelect = (goalId) => {
    const { heaven } = this.state;
    const lines = heaven.getLines();
    if (!lines[goalId]) return;
    const line = lines[goalId];
    const place = line.coordinates ? `(${line.coordinates.x}, ${line.coordinates.y}, ${line.coordinates.z})` : "default";
    const sceneId = this.state.scenes.find(scene => scene.name === place || scene.name === "default")?.id || this.state.scenes[0]?.id;
    const selectedCharacter = heaven.getCharacters()?.[0]?.name || null;
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

  manifest = async () => {
    const { heaven, selectedGoalId, script, stateSnapshots, timeTravelCode } = this.state;
    if (!selectedGoalId) {
      alert('Please select a goal.');
      return;
    }

    const line = heaven.getLines()[selectedGoalId];
    let localTimeTravelCode = timeTravelCode;

    if (!localTimeTravelCode) {
      localTimeTravelCode = heaven.getTimeTravelFile();
      if (!localTimeTravelCode) {
        console.warn('No timetravelfile available, generating new one...');
        await this.generateTimeTravelFile();
        localTimeTravelCode = this.state.timeTravelCode;
        if (!localTimeTravelCode) {
          console.error('Failed to load or generate timetravelfile');
          alert(
            `Failed to load or generate timetravelfile. A default timetravel.js has been saved to Realtime Database at /heavens/${this.state.heavenId}/timetravelfile.`
          );
          return;
        }
      }
    }

    this.setState({ isValidating: true });

    try {
      const openai = await getOpenAIInstance();

      const prompt = MANIFEST_PROMPT
        .replace('{{TIME_TRAVEL_CODE}}', localTimeTravelCode)
        .replace('{{GOAL_TEXT}}', line.text)
        .replace('{{PRIMARY_EMOTION}}', line.primaryEmotion)
        .replace('{{SECONDARY_EMOTION}}', line.secondaryEmotion)
        .replace('{{COORD_X}}', line.coordinates.x)
        .replace('{{COORD_Y}}', line.coordinates.y)
        .replace('{{COORD_Z}}', line.coordinates.z)
        .replace('{{END_X}}', line.endX)
        .replace('{{END_Y}}', line.endY)
        .replace('{{END_Z}}', line.endZ)
        .replace('{{OBJECT_STATES}}', line.objectStates.join(", "))
        .replace('{{STATE_SNAPSHOTS}}', JSON.stringify(stateSnapshots, null, 2));

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a narrative design expert for time-travel stories.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
      };

      const gptResponse = await openai.chat.completions.create(payload);
      const aiResponse = gptResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(aiResponse);

      if (parsed.response === 'accept' && parsed.probability >= 0.7) {
        await this.saveStateToJson();
        this.setState(prev => ({
          manifestationHistory: [
            ...prev.manifestationHistory,
            {
              goalId: selectedGoalId,
              actions: prev.manifestationActions,
              timestamp: Math.floor(Date.now() / 1000),
            },
          ],
          selectedGoalId: null,
          selectedCharacter: null,
          selectedObject: null,
          manifestationActions: [],
          selectedCastId: null,
          selectedSceneId: null,
          activeAction: null,
        }));
        heaven.updateManifestationHistory(this.state.manifestationHistory);
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
        });
        alert(`Goal has manifested! Probability: ${parsed.probability}, Reasoning: ${parsed.reasoning}`);
      } else {
        alert(`Goal did not manifest. Probability: ${parsed.probability}, Reasoning: ${parsed.reasoning}`);
      }
      this.setState({ isValidating: false, activeAction: null });
    } catch (error) {
      console.error('Error manifesting goal:', error);
      alert('Failed to manifest goal.');
      this.setState({ isValidating: false, activeAction: null });
    }
  };

  saveStateToJson = async () => {
    const { heaven, script, stateSnapshots, manifestationHistory, heavenId } = this.state;
    heaven.updateStateSnapshots(stateSnapshots);
    heaven.updateManifestationHistory(manifestationHistory);
    await heaven.updateHeavenFirebase();
    await saveHeavenData(heaven.getAllData(), 'heavenFromAI.json', heavenId);
  };

  saveScriptToJson = async () => {
    const { heaven, script, stateSnapshots, manifestationHistory, heavenId } = this.state;
    heaven.updateStateSnapshots(stateSnapshots);
    heaven.updateManifestationHistory(manifestationHistory);
    await heaven.updateHeavenFirebase();
    await saveHeavenData(heaven.getAllData(), 'heavenFromAI.json', heavenId);
  };

  saveStateToFile = async () => {
    const { heaven, script, stateSnapshots, manifestationHistory, heavenId } = this.state;
    heaven.updateStateSnapshots(stateSnapshots);
    heaven.updateManifestationHistory(manifestationHistory);
    await saveHeavenData(heaven.getAllData(), 'heavenFromAI.json', heavenId);
  };

  render() {
    const {
      heaven,
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
      timeMachineDestination,
      movementHistory,
      selectedSceneId,
      loadingProgress,
    } = this.state;

    if (loadingProgress < 100) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-semibold mb-4">Loading Journey...</h2>
          <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-600">{loadingProgress}% Complete</p>
        </div>
      );
    }

    return (
      <div className="CustomerWorkstation">
        <h2 className="CustomerWorkstation--title">{heaven?.getTitle() || "Loading..."}</h2>
        <GoalManager
          heaven={heaven}
          script={script}
          selectedGoalId={selectedGoalId}
          selectedCharacter={selectedCharacter}
          selectedObject={selectedObject}
          manifestationActions={manifestationActions}
          isValidating={isValidating}
          allMessages={allMessages}
          cast={cast}
          scenes={scenes}
          activeAction={activeAction}
          timeMachineDestination={timeMachineDestination}
          movementHistory={movementHistory}
          selectedSceneId={selectedSceneId}
          onGoalSelect={this.handleGoalSelect}
          onCloseGoalSection={this.handleCloseGoalSection}
          onManifest={this.manifest}
          onSaveScriptToJson={this.saveScriptToJson}
          onSaveStateToFile={this.saveStateToFile}
          setState={(updates) => this.setState(updates)}
        />
        {script &&
          <EditScript 
            isNewScript={true} 
            script={script} 
          />
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let CustomerWorkstation = withRouter(connect(mapStateToProps)(ConnectedCustomerWorkstation));
export default withRouter(CustomerWorkstation);