import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import EditScript from "../EditScript/EditScript.js";
import confetti from 'canvas-confetti';
import Firebase from "../../firebase/firebase.js";
import Heaven from "../Heaven/Heaven.js";
import GoalManager from "./GoalManager.js";
import { GENERATE_TIME_TRAVEL_PROMPT, MANIFEST_PROMPT, DEFAULT_TIME_TRAVEL_CODE } from "./prompts.js";
import { staticManifestResponse } from "./responses.js";

import "./CustomerWorkstation.css";

function getFallbackHeavenData() {
  try {
    return require('./heavenFromAI.json');
  } catch (err) {
    console.error('Failed to load fallback heaven data:', err);
    return null;
  }
}

async function saveHeavenData(data, filename = 'heavenFromAI.json', heavenId) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const field = filename === 'timetravel.js' ? 'timetravelfile' : 'heavenData';
  try {
    await Firebase.saveHeavenData(heavenId, content, field);
    return true;
  } catch (err) {
    console.error(`Failed to save ${filename} to Realtime Database:`, err);
    return false;
  }
}

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

function stripCodeFences(code) {
  if (!code) return '';
  return code
    .replace(/^```(?:javascript|js)?\n/, '')
    .replace(/\n```$/, '')
    .trim();
}

function parseOpenAIManifestResponse(gptResponse) {
  const aiResponse = gptResponse.choices?.[0]?.message?.content || JSON.stringify(gptResponse);
  if (!aiResponse) {
    console.error('Empty or invalid OpenAI response:', gptResponse);
    throw new Error('No content in OpenAI response');
  }
  const jsonMatch = aiResponse.match(/{[\s\S]*}/);
  const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
    parsed.probability = typeof parsed.probability === 'string'
      ? parseFloat(parsed.probability.replace(/[<>"]/g, '')) || 0
      : parseFloat(parsed.probability) || 0;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError, 'aiResponse:', aiResponse);
    throw new Error('Invalid OpenAI response format');
  }
  if (!parsed.response || !parsed.reasoning || typeof parsed.probability !== 'number') {
    console.error('Invalid OpenAI response structure:', parsed);
    throw new Error('Missing required fields in OpenAI response');
  }
  return parsed;
}

class ConnectedCustomerWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heaven: null,
      script: null,
      scriptId: null,
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
      if (heaven.data?.scriptId) {
        await heaven.loadScript();
      }

      const lines = heaven.getLines() || {};
      const lineKeys = Object.keys(lines).map(Number);

      let goalInProgress = heaven.getCurrentGoalInProgress();
      if (goalInProgress === undefined) {
        goalInProgress = await heaven.getCurrentGoalInProgress();
      }

      if (goalInProgress === null || !lines[goalInProgress]) {
        if (lineKeys.length > 0) {
          goalInProgress = Math.min(...lineKeys);
          await heaven.setCurrentGoalInProgress(goalInProgress);
        } else {
          goalInProgress = null;
        }
      }

      const manifestationHistory = heaven.getManifestationHistory() || [];

      this.setState({
        heaven,
        manifestationHistory,
        loadingProgress: 50,
      });
    } catch (error) {
      console.error(`Error initializing Heaven for ID: ${heavenId || 'fallback'}:`, error);
      heaven = await Heaven.create(null, getFallbackHeavenData());
      const lines = heaven.getLines() || {};
      const lineKeys = Object.keys(lines).map(Number);
      let goalInProgress = null;
      if (lineKeys.length > 0) {
        goalInProgress = Math.min(...lineKeys);
        await heaven.setCurrentGoalInProgress(goalInProgress);
      }
      this.setState({ heaven, manifestationHistory: [], loadingProgress: 50 });
    }

    let timeTravelCode = heaven.getTimeTravelFile();
    this.setState({ loadingProgress: 60 });

    if (timeTravelCode && typeof timeTravelCode === 'string') {
      timeTravelCode = timeTravelCode
        .replace(/export\s+(default\s+)?/g, '')
        .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '');
      try {
        const scriptFunction = new Function(timeTravelCode + '; return ThrydObjects;');
        const ThrydObjects = scriptFunction();
        if (ThrydObjects && typeof ThrydObjects.initiateThrydObjectsAndExecuteMovement === 'function') {
          ThrydObjects.initiateThrydObjectsAndExecuteMovement();
          const destination = ThrydObjects.timeMachine.getDestination();
          const history = ThrydObjects.getHistory();
          this.setState({
            timeTravelCode,
            timeMachineDestination: destination,
            movementHistory: history,
          });
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
      await this.generateTimeTravelFile();
      timeTravelCode = this.state.timeTravelCode;
      if (!timeTravelCode) {
        console.warn('Failed to generate timetravel.js. Using default.');
        await this.createDefaultTimeTravelFile();
      }
    }
    this.setState({ loadingProgress: 80 });

    const script = heaven.getScript();
    const scriptId = heaven.data?.scriptId || null;
    if (script && scriptId && heaven.getAllData()) {
      try {
        this.setState({
          script,
          scriptId,
          cast: heaven.getCharacters() || [],
          scenes: script.getScenes() || [],
          allMessages: script.getAllMessagesAsNodes(),
          stateSnapshots: heaven.getStateSnapshots() || [],
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
            content: 'You are a JavaScript expert. Generate syntactically correct plain JavaScript code (no ES modules, no export/import) that defines ThrydObjects with initiateThrydObjectsAndExecuteMovement, timeMachine.getDestination, and getHistory functions.',
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
        const gptResponse = await openai.chat.completions.create(payload);
        if (!gptResponse.choices?.[0]?.message?.content) {
          throw new Error('Empty or invalid OpenAI response');
        }
        timeTravelCode = stripCodeFences(gptResponse.choices[0].message.content);
        if (!timeTravelCode) {
          throw new Error('No valid code after stripping fences');
        }
        timeTravelCode = timeTravelCode
          .replace(/export\s+(default\s+)?/g, '')
          .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '');
        const esprima = require('esprima');
        try {
          esprima.parseScript(timeTravelCode);
        } catch (parseError) {
          console.error('Esprima parsing failed:', parseError);
          let fixedCode = timeTravelCode;
          if (!fixedCode.endsWith(';')) {
            fixedCode += ';';
          }
          try {
            esprima.parseScript(fixedCode);
            timeTravelCode = fixedCode;
          } catch (fixError) {
            console.error('Fix attempt failed:', fixError);
            throw parseError;
          }
        }
      } catch (error) {
        console.error('Error processing OpenAI response:', error);
        timeTravelCode = null;
      }

      if (timeTravelCode) {
        const existingTimeTravelFile = heaven.getTimeTravelFile();
        if (existingTimeTravelFile === timeTravelCode) {
          this.setState({ timeTravelCode });
        } else {
          this.setState({ timeTravelCode });
          await heaven.setTimeTravelFile(timeTravelCode);
        }
      } else {
        console.error('Failed to generate valid timetravel.js');
        await this.createDefaultTimeTravelFile();
      }
    } catch (error) {
      console.error('Error generating timetravel.js:', error);
      await this.createDefaultTimeTravelFile();
    }
  }

  async createDefaultTimeTravelFile() {
    const { heaven, heavenId } = this.state;
    const defaultTimeTravelCode = DEFAULT_TIME_TRAVEL_CODE;
    const existingTimeTravelFile = heaven.getTimeTravelFile();
    if (existingTimeTravelFile === defaultTimeTravelCode) {
      this.setState({ timeTravelCode: defaultTimeTravelCode });
    } else {
      this.setState({ timeTravelCode: defaultTimeTravelCode });
      await heaven.setTimeTravelFile(defaultTimeTravelCode);
    }
  }

  componentWillUnmount() {
    if (this.saveInterval) clearInterval(this.saveInterval);
  }

  componentDidUpdate(prevProps, prevState) {
    const { script, allMessages } = this.state;
    if (script) {
      const currentMessages = script.getAllMessagesAsNodes();
      if (currentMessages.length > allMessages.length) {
        this.setState({ allMessages: currentMessages });
      }
    }
  }

  handleGoalSelect = async (goalId) => {
    const { heaven } = this.state;
    const lines = heaven.getLines();
    if (!lines[goalId]) return;
    const line = lines[goalId];
    const place = line.coordinates ? `(${line.coordinates.x}, ${line.coordinates.y}, ${line.coordinates.z})` : "default";
    const sceneId = this.state.scenes.find(scene => scene.name === place || scene.name === "default")?.id || this.state.scenes[0]?.id;
    this.setState({
      selectedSceneId: sceneId,
      manifestationActions: [],
      activeAction: null,
    });
    try {
      await heaven.setCurrentGoalInProgress(goalId);
    } catch (error) {
      console.error("Error saving currentGoalInProgress:", error);
    }
  };

  manifest = async () => {
    const { heaven, script, stateSnapshots, timeTravelCode } = this.state;
    const selectedGoalId = heaven.getCurrentGoalInProgress();
    if (selectedGoalId === null || !heaven.getLines()[selectedGoalId]) {
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
          await this.createDefaultTimeTravelFile();
          return;
        }
      }
    }

    this.setState({ isValidating: true });

    try {
      const gptResponse = {
        choices: [{
          message: {
            content: JSON.stringify(staticManifestResponse)
          }
        }]
      };

      const parsed = parseOpenAIManifestResponse(gptResponse);

      if (parsed.response === 'accept' && parsed.probability >= 0.7) {
        const newHistory = [
          ...this.state.manifestationHistory,
          {
            goalId: selectedGoalId,
            actions: this.state.manifestationActions,
            timestamp: Math.floor(Date.now() / 1000),
            sceneId: this.state.selectedSceneId
          },
        ];
        this.setState({
          manifestationHistory: newHistory,
          manifestationActions: [],
          selectedCastId: null,
          selectedSceneId: null,
          activeAction: null,
        });
        heaven.updateManifestationHistory(newHistory);
        await heaven.setCurrentGoalInProgress(null);
        await this.saveStateToJson();
        
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
        });
        alert(`Goal has manifested! Probability: ${parsed.probability.toFixed(2)}, Reasoning: ${parsed.reasoning}`);
      } else {
        alert(`Goal did not manifest. Probability: ${parsed.probability.toFixed(2)}, Reasoning: ${parsed.reasoning}`);
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

  render() {
    const {
      heaven,
      script,
      scriptId,
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
      manifestationHistory,
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
        {script && (
          <EditScript
            isNewScript={true}
            script={script}
          />
        )}
        <GoalManager
          heaven={heaven}
          script={script}
          selectedGoalId={heaven.getCurrentGoalInProgress()}
          manifestationActions={manifestationActions}
          isValidating={isValidating}
          allMessages={allMessages}
          cast={cast}
          scenes={scenes}
          activeAction={activeAction}
          timeMachineDestination={timeMachineDestination}
          movementHistory={movementHistory}
          selectedSceneId={selectedSceneId}
          manifestationHistory={manifestationHistory}
          onGoalSelect={this.handleGoalSelect}
          onManifest={this.manifest}
          onSaveScriptToJson={this.saveScriptToJson}
          setState={(updates) => this.setState(updates)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let CustomerWorkstation = withRouter(connect(mapStateToProps)(ConnectedCustomerWorkstation));
export default withRouter(CustomerWorkstation);

// const openai = await getOpenAIInstance();

      // const prompt = MANIFEST_PROMPT
      //   .replace('{{TIME_TRAVEL_CODE}}', localTimeTravelCode)
      //   .replace('{{GOAL_TEXT}}', line.text)
      //   .replace('{{PRIMARY_EMOTION}}', line.primaryEmotion)
      //   .replace('{{SECONDARY_EMOTION}}', line.secondaryEmotion)
      //   .replace('{{COORD_X}}', line.coordinates.x)
      //   .replace('{{COORD_Y}}', line.coordinates.y)
      //   .replace('{{COORD_Z}}', line.coordinates.z)
      //   .replace('{{END_X}}', line.endX)
      //   .replace('{{END_Y}}', line.endY)
      //   .replace('{{END_Z}}', line.endZ)
      //   .replace('{{OBJECT_STATES}}', line.objectStates.join(", "))
      //   .replace('{{STATE_SNAPSHOTS}}', JSON.stringify(stateSnapshots, null, 2));

      // const payload = {
      //   model: 'gpt-3.5-turbo',
      //   messages: [
      //     {
      //       role: 'system',
      //       content: 'You are a narrative design expert for time-travel stories.',
      //     },
      //     {
      //       role: 'user',
      //       content: prompt,
      //     },
      //   ],
      //   temperature: 0.5,
      // };