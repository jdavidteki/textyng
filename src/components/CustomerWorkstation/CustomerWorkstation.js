import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import EditScript from "../EditScript/EditScript.js";
import TextField from "@material-ui/core/TextField";
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

// Utility to load heaven data safely
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

// Utility to save data to a file
function saveHeavenData(data, filename = 'timetravel.js') {
  try {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/javascript' });
    saveAs(blob, filename);
    console.log(`Saved ${filename} to downloads. Move it to src/components/CustomerWorkstation/ and rebuild with \`npm run build\`.`);
    return true;
  } catch (err) {
    console.error(`Failed to save ${filename}:`, err);
    return false;
  }
}

// Utility to strip Markdown code fences, hidden characters, and normalize code
function stripCodeFences(code) {
  if (!code || typeof code !== 'string') return '';
  // Remove BOM, non-ASCII characters, and normalize line endings
  let cleaned = code.replace(/^\uFEFF/, '') // Remove BOM
                    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII
                    .replace(/\r\n|\r/g, '\n') // Normalize to \n
                    .replace(/^\s*```(?:\w+)?\s*?\n?([\s\S]*?)\n?\s*```?\s*$/, '$1') // Remove code fences
                    .replace(/^\s*```.*$/gm, '') // Remove stray ``` lines
                    .trim();
  // Ensure the code ends with a semicolon if it’s an export statement
  if (cleaned.match(/export default .*$/)) {
    cleaned = cleaned.replace(/export default ([^;]*)$/, 'export default $1;');
  }
  return cleaned;
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
      stateSnapshots: [],
      activeAction: null,
      timeTravelCode: null,
    };
    this.saveInterval = null;
  }

  async componentDidMount() {
    let timeTravelCode = null;

    try {
      const module = await import('./timetravel.js');
      timeTravelCode = module.default || module.initiateThrydObjectsAndExecuteMovement;
      if (typeof timeTravelCode !== 'function' && typeof timeTravelCode !== 'string') {
        throw new Error('Invalid timetravel.js content');
      }
    } catch (requireErr) {
      console.warn('timetravel.js not found or failed to load:', requireErr);
      console.log('Attempting to generate timetravel.js...');
      await this.generateTimeTravelFile();
      timeTravelCode = this.state.timeTravelCode;
      if (!timeTravelCode) {
        console.warn('Failed to generate timetravel.js. A default timetravel.js has been saved to downloads.');
        alert(
          'Failed to load or generate timetravel.js. A default timetravel.js has been saved to your downloads folder. ' +
          'Please move it to src/components/CustomerWorkstation/ and rebuild the project with `npm run build`.'
        );
      }
    }

    if (timeTravelCode) {
      try {
        let initiateThrydObjectsAndExecuteMovement;
        if (typeof timeTravelCode === 'string') {
          const scriptFunction = new Function(timeTravelCode + '; return initiateThrydObjectsAndExecuteMovement;');
          initiateThrydObjectsAndExecuteMovement = scriptFunction();
        } else {
          initiateThrydObjectsAndExecuteMovement = timeTravelCode;
        }
        if (typeof initiateThrydObjectsAndExecuteMovement === 'function') {
          initiateThrydObjectsAndExecuteMovement();
        } else {
          console.error('initiateThrydObjectsAndExecuteMovement is not a function');
        }
      } catch (err) {
        console.error('Error executing timetravel.js:', err);
      }
    } else {
      console.warn('No timetravel.js available. Proceeding with default initialization.');
    }

    const { heavenData } = this.state;
    if (heavenData) {
      try {
        const script = new Script(heavenData.script.title, false);
        if (heavenData.script.messages) {
          heavenData.script.messages.forEach(msg => script.addNewMessage(msg));
        }
        if (heavenData.script.cast) script.updateCast(heavenData.script.cast);
        if (heavenData.script.scenes) script.updateScene(heavenData.script.scenes);
        if (heavenData.stateSnapshots) this.setState({ stateSnapshots: heavenData.stateSnapshots });
        if (heavenData.manifestationHistory) this.setState({ manifestationHistory: heavenData.manifestationHistory });

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

  async generateTimeTravelFile() {
    const { heavenData } = this.state;
    if (!heavenData) {
      console.error('No heavenData available to generate timetravel.js');
      alert('No heavenData available. A default timetravel.js has been saved to downloads. Move it to src/components/CustomerWorkstation/ and rebuild with `npm run build`.');
      this.createDefaultTimeTravelFile();
      return;
    }

    try {
      const openAIAPI = await Firebase.getOpenAIAPI();
      const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join("") : openAIAPI;
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });

      const prompt = `
        You are an expert in JavaScript and narrative design for a time-travel story. Your task is to generate a technically valid JavaScript file called "timetravel.js" based on the provided JSON data (heavenFromAI.json). The file must adhere to strict JavaScript syntax and best practices, including ES6 module syntax, stateless methods, and safe action execution.

        **Requirements**:
        1. **Structure**:
           - Define a \`ThrydObjects\` object containing all relevant objects from the JSON (e.g., door, timeMachine) and inferred objects for a time-travel narrative (e.g., controlPanel).
           - Each object must have an \`isOriginalObject()\` method returning \`true\` for JSON-derived objects and \`false\` for inferred ones.
           - Objects must have stateless methods that return new state objects (e.g., \`setIsClosed(isClosed) => ({ isClosed })\`) instead of mutating \`this\`.
           - Getter methods (e.g., \`isClosed(state)\`) must accept a \`state\` parameter and return a default value if undefined (e.g., \`state.isClosed || false\`).
           - Include an \`actionHandlers\` object mapping action names (e.g., \`openDoor\`) to functions that call object methods.
           - Implement a \`doMovement(timestamp, ...actions)\` method to execute actions safely using \`actionHandlers\`, without using \`eval\` or \`new Function\`.
           - Define a top-level \`initiateThrydObjectsAndExecuteMovement()\` function that simulates a narrative timeline by calling \`doMovement\` with UNIX timestamps (milliseconds since epoch, e.g., 1715324160000 for May 10, 2025).

        2. **Action Execution**:
           - Actions can be strings (e.g., 'openDoor') or objects (e.g., { type: 'setTimeMachineDestination', payload: { x, y, z } }).
           - Use \`actionHandlers\` to map actions to their implementations (e.g., \`actionHandlers.openDoor = () => ThrydObjects.door.open()\`).
           - Log each action’s execution and return a result object: \`{ timestamp, results: [{ action, result | error }] }\`.
           - Include error handling to catch and log invalid actions.

        3. **Syntax and Best Practices**:
           - Use ES6 arrow functions for methods (e.g., \`isOriginalObject: () => true\`).
           - Ensure all statements end with semicolons.
           - Use \`export default initiateThrydObjectsAndExecuteMovement;\` as the sole export.
           - Do not call \`initiateThrydObjectsAndExecuteMovement\` within the file.
           - Avoid \`eval\`, \`new Function\`, or other unsafe constructs.
           - Use \`console.log\` for debugging, with clear messages.
           - Ensure all object literals include commas between properties (e.g., { prop1: 1, prop2: 2 }).
           - Avoid reserved keywords (e.g., 'class', 'function') as property names or variables.
           - Ensure all brackets, parentheses, and braces are properly closed.
           - Use single quotes for strings unless template literals are required.
           - Do not wrap the code in Markdown code fences (e.g., \`\`\`javascript or \`\`\`).

        4. **JSON Data**:
           - Analyze the provided JSON to identify objects and their properties.
           - Infer additional objects that enhance the time-travel narrative, labeling them with \`isOriginalObject: () => false\`.

        **JSON Data**:
        ${JSON.stringify(heavenData, null, 2)}

        **Output**:
        - Return the complete JavaScript code as a plain string, ready to be saved as "timetravel.js".
        - Do not include Markdown code fences (e.g., \`\`\`javascript or \`\`\`) or any formatting markers.
        - Ensure the code is syntactically correct and can be parsed by Webpack without errors.
        - Verify that all object properties are separated by commas and that no reserved keywords are used as identifiers.

        **Example Output**:
        const ThrydObjects = {
          door: {
            isOriginalObject: () => true,
            setIsClosed: (isClosed) => ({ isClosed }),
            isClosed: (state) => state.isClosed || false,
            open: () => ({ action: 'open', status: 'success' }),
          },
          actionHandlers: {
            openDoor: () => ThrydObjects.door.open(),
          },
          doMovement: (timestamp, ...actions) => {
            console.log('Executing actions at timestamp ' + timestamp + ':');
            const results = [];
            // Process actions using actionHandlers
            return { timestamp, results };
          },
        };

        function initiateThrydObjectsAndExecuteMovement() {
          const timestamp = 1715324160000;
          ThrydObjects.doMovement(timestamp, { type: 'openDoor' });
        }

        export default initiateThrydObjectsAndExecuteMovement;
      `;

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
        console.log(`OpenAI response took ${Date.now() - startTime}ms`);
        console.log('Raw OpenAI response:', gptResponse);

        if (!gptResponse.choices?.[0]?.message?.content) {
          throw new Error('Empty or invalid OpenAI response');
        }

        timeTravelCode = stripCodeFences(gptResponse.choices[0].message.content);
        console.log('Cleaned timeTravelCode:', timeTravelCode);

        if (!timeTravelCode) {
          throw new Error('No valid code after stripping fences');
        }

        // Log character codes around line 50 to detect hidden characters
        const lines = timeTravelCode.split('\n');
        if (lines.length >= 50) {
          const line50 = lines[49]; // Line 50 (0-based index)
          console.log('Line 50 characters:', line50.split('').map(c => c.charCodeAt(0)));
        }

        const esprima = require('esprima');
        try {
          esprima.parseModule(timeTravelCode); // Use parseModule for ES6 modules
        } catch (parseError) {
          console.error('Esprima parsing failed:', parseError);
          // Attempt to fix common issues (e.g., add semicolon)
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
            throw parseError; // Rethrow original error
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
        timeTravelCode = null; // Trigger fallback
      }

      if (timeTravelCode) {
        this.setState({ timeTravelCode });
        const success = saveHeavenData(timeTravelCode, 'timetravel.js');
        if (success) {
          console.log('timetravel.js generated and saved to downloads.');
          alert(
            'timetravel.js generated and saved to downloads. Move it to src/components/CustomerWorkstation/ and rebuild with `npm run build`.'
          );
        } else {
          console.error('Failed to save timetravel.js');
          this.createDefaultTimeTravelFile();
        }
      } else {
        console.error('Failed to generate valid timetravel.js from OpenAI');
        this.createDefaultTimeTravelFile();
      }
    } catch (error) {
      console.error('Error generating timetravel.js with OpenAI:', error);
      this.createDefaultTimeTravelFile();
    }
  }

  createDefaultTimeTravelFile() {
    const defaultTimeTravelCode = `
const ThrydObjects = {
  door: {
    isOriginalObject: () => true,
    setIsClosed: (isClosed) => ({ isClosed }),
    isClosed: (state) => state.isClosed || false,
    open: () => ({ action: 'open', status: 'success' }),
  },
  timeMachine: {
    isOriginalObject: () => true,
    setDestination: ({ x, y, z }) => ({ x, y, z }),
    getDestination: (state) => state.destination || { x: 0, y: 0, z: 0 },
  },
  controlPanel: {
    isOriginalObject: () => false,
    togglePower: () => ({ action: 'togglePower', status: 'success' }),
  },
  actionHandlers: {
    openDoor: () => ThrydObjects.door.open(),
    setTimeMachineDestination: ({ payload }) => ThrydObjects.timeMachine.setDestination(payload),
    togglePower: () => ThrydObjects.controlPanel.togglePower(),
  },
  doMovement: (timestamp, ...actions) => {
    console.log(\`Executing actions at timestamp \${timestamp}:\`);
    const results = actions.map(action => {
      try {
        if (typeof action === 'string') {
          if (ThrydObjects.actionHandlers[action]) {
            return { action, result: ThrydObjects.actionHandlers[action]() };
          }
          throw new Error(\`Action '\${action}' is not valid.\`);
        } else if (action.type && ThrydObjects.actionHandlers[action.type]) {
          return { action: action.type, result: ThrydObjects.actionHandlers[action.type](action) };
        }
        throw new Error(\`Action '\${action.type}' is not valid.\`);
      } catch (error) {
        return { action, error: error.message };
      }
    });
    return { timestamp, results };
  },
};

function initiateThrydObjectsAndExecuteMovement() {
  const timestamp = 1736380800000; // Jan 10, 2026 00:00:00 UTC
  ThrydObjects.doMovement(timestamp, 'openDoor', { type: 'setTimeMachineDestination', payload: { x: 10, y: 20, z: 30 } }, 'togglePower');
}

export default initiateThrydObjectsAndExecuteMovement;
    `.trim();

    this.setState({ timeTravelCode: defaultTimeTravelCode });
    const success = saveHeavenData(defaultTimeTravelCode, 'timetravel.js');
    if (success) {
      console.log('Default timetravel.js saved to downloads.');
      alert(
        'Failed to generate timetravel.js via OpenAI. A default timetravel.js has been saved to your downloads folder. ' +
        'Please move it to src/components/CustomerWorkstation/ and rebuild with `npm run build`.'
      );
    } else {
      console.error('Failed to save default timetravel.js');
      alert(
        'Failed to save default timetravel.js. Please manually save the following content as src/components/CustomerWorkstation/timetravel.js and rebuild with `npm run build`:\n\n' +
        defaultTimeTravelCode
      );
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

  manifest = async () => {
    const { heavenData, selectedGoalId, script, stateSnapshots, timeTravelCode } = this.state;
    if (!selectedGoalId) {
      alert('Please select a goal.');
      return;
    }

    const line = heavenData.lines[selectedGoalId];
    let localTimeTravelCode = timeTravelCode;

    if (!localTimeTravelCode) {
      try {
        const module = await import('./timetravel.js');
        localTimeTravelCode = module.default || module.initiateThrydObjectsAndExecuteMovement;
        if (typeof localTimeTravelCode !== 'string' && typeof localTimeTravelCode !== 'function') {
          throw new Error('Invalid timetravel.js content');
        }
        if (typeof localTimeTravelCode === 'function') {
          localTimeTravelCode = localTimeTravelCode.toString();
        }
      } catch (requireErr) {
        console.warn('timetravel.js not found or invalid:', requireErr);
        console.log('Generating timetravel.js...');
        await this.generateTimeTravelFile();
        localTimeTravelCode = this.state.timeTravelCode;
        if (!localTimeTravelCode) {
          console.error('Failed to load or generate timetravel.js');
          alert(
            'Failed to load or generate timetravel.js. A default timetravel.js has been saved to your downloads folder. ' +
            'Please move it to src/components/CustomerWorkstation/ and rebuild with `npm run build`.'
          );
          return;
        }
      }
    }

    this.setState({ isValidating: true });

    try {
      const openAIAPI = process.env.REACT_APP_OPENAI_API_KEY;
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openAIAPI, dangerouslyAllowBrowser: true });

      const prompt = `
        You are an expert at determining if a goal manifests in a time-travel narrative. Below is the content of timetravel.js, which includes the initiateThrydObjectsAndExecuteMovement() function that logs object state updates over a narrative timeline using thrydObjects.doMovement(timestamp, ...actions) with UNIX timestamps. These state updates are managed by script.js based on actions (e.g., "he drops the cup in the kitchen" might trigger cup.updateLocation(kitchen.location)). Your task is to analyze the sequence of state updates and determine if the given goal line is logically plausible based on these movements, using narrative intuition. If a required state is missing (e.g., an object method cannot be called due to lack of context or synchronization), treat this as an external force that can prevent the goal from manifesting, and include this in your reasoning.

        timetravel.js content:
        ${localTimeTravelCode || 'No timetravel.js content available'}

        Goal: "${line.text}"
        Emotion: ${line.primaryEmotion} (${line.secondaryEmotion})
        Place: ${line.place || 'default'}
        State Snapshots: ${JSON.stringify(stateSnapshots, null, 2)}

        Instructions:
        1. Parse the initiateThrydObjectsAndExecuteMovement() function to extract all thrydObjects.doMovement calls and their UNIX timestamps.
        2. Evaluate the sequence of object state updates to determine if they support the goal line's plausibility.
        3. Use narrative intuition to connect object movements to the goal, considering the place and emotions.
        4. If a required state or context is missing (e.g., an object method cannot be called), identify this as an external force preventing manifestation.
        5. Return {"response": "accept", "probability": <number>, "reasoning": "<explanation>"} if the probability exceeds 0.7, else {"response": "decline", "probability": <number>, "reasoning": "<explanation>"}.
      `;

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
    const { heavenData, script, stateSnapshots, manifestationHistory } = this.state;
    const newHeavenData = {
      ...heavenData,
      script: {
        title: script.getTitle(),
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
        title: script.getTitle(),
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
        title: script.getTitle(),
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
        <h2 className="CustomerWorkstation--title">Manifest Your Time-Travel Narrative</h2>

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

        {selectedGoalId !== null && (
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
                  onClick={this.saveScriptToJson}
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