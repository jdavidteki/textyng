export const GENERATE_TIME_TRAVEL_PROMPT = `
You are an expert in JavaScript and narrative design for a time-travel story. Your task is to generate a technically valid JavaScript file called "timetravel.js" based on the provided JSON data (heavenFromAI.json). The file must adhere to strict JavaScript syntax and best practices, including ES6 module syntax and stateful methods with action history.

**Requirements**:
1. **Structure**:
   - Define a \`ThrydObjects\` object as the default export, containing all relevant objects from the JSON (e.g., door, timeMachine) and inferred objects (e.g., controlPanel).
   - Each object must have an \`isOriginalObject()\` method returning \`true\` for JSON-derived objects and \`false\` for inferred ones.
   - Objects like \`timeMachine\` must maintain internal state (e.g., \`_state: { destination: null }\`) for properties like destination.
   - Methods like \`setDestination\` must update internal state and return the new state.
   - Getter methods (e.g., \`getDestination()\`) must return the internal state or a default value (e.g., \'{ x: 0, y: 0, z: 0 }\`) without requiring a state parameter.
   - Include an \`actionHandlers\` object mapping action names (e.g., \`openDoor\`) to functions that call object methods.
   - Implement a \`doMovement(timestamp, ...actions)\` method to execute actions using \`actionHandlers\`, storing results in a \`_history\` array.
   - Add an \`initiateThrydObjectsAndExecuteMovement()\` method inside \`ThrydObjects\` to simulate a narrative timeline by calling \`doMovement\` with UNIX timestamps.
   - Add a \`getHistory()\` method to return the action history.

2. **Action Execution**:
   - Actions can be strings (e.g., 'openDoor') or objects (e.g., { type: 'setTimeMachineDestination', payload: { x, y, z } }).
   - Use \`actionHandlers\` to map actions to implementations (e.g., \`actionHandlers.openDoor = () => ThrydObjects.door.open()\`).
   - Log each action’s execution and store results in \`_history\` as \`{ timestamp, results: [{ action, result | error }] }\`.
   - Return the same result from \`doMovement\`.
   - Include error handling for invalid actions.

3. **Syntax and Best Practices**:
   - Use ES6 arrow functions for methods.
   - Ensure all statements end with semicolons.
   - Use \`export default ThrydObjects;\` as the sole export.
   - Avoid unsafe constructs like \`eval\` or \`new Function\`.
   - Use \`console.log\` for debugging.
   - Ensure proper comma separation in object literals.
   - Avoid reserved keywords as property names.
   - Use single quotes for strings unless template literals are needed.
   - Do not wrap code in Markdown code fences.

4. **JSON Data**:
   - Analyze the provided JSON to identify objects and properties.
   - Infer additional objects for the time-travel narrative, labeling them with \`isOriginalObject: () => false\`.
   - Use lines' objectStates (e.g., microphone, shadow) to define ThrydObjects.
   - Map coordinates and endX/Y/Z to timeMachine destinations.

**JSON Data**:
{{JSON_DATA}}

**Output**:
- Return the complete JavaScript code as a plain string, ready to be saved as "timetravel.js".
- Ensure syntactic correctness for Webpack parsing.
- Verify proper comma separation and no reserved keywords.

**Example Output**:
const ThrydObjects = {
  _history: [],
  microphone: {
    isOriginalObject: () => true,
    setActive: (isActive) => ({ isActive }),
    isActive: (state) => state.isActive || false,
    activate: () => ({ action: 'activate', status: 'success' }),
  },
  timeMachine: {
    isOriginalObject: () => true,
    _state: { destination: null },
    setDestination: ({ x, y, z }) => {
      ThrydObjects.timeMachine._state.destination = { x, y, z };
      return ThrydObjects.timeMachine._state.destination;
    },
    getDestination: () => ThrydObjects.timeMachine._state.destination || { x: 0, y: 0, z: 0 },
  },
  actionHandlers: {
    activateMicrophone: () => ThrydObjects.microphone.activate(),
    setTimeMachineDestination: ({ payload }) => ThrydObjects.timeMachine.setDestination(payload),
  },
  doMovement: (timestamp, ...actions) => {
    console.log('Executing actions at timestamp ' + timestamp + ':');
    const results = actions.map(action => {
      try {
        if (typeof action === 'string' && ThrydObjects.actionHandlers[action]) {
          return { action, result: ThrydObjects.actionHandlers[action]() };
        } else if (action.type && ThrydObjects.actionHandlers[action.type]) {
          return { action: action.type, result: ThrydObjects.actionHandlers[action.type](action) };
        }
        throw new Error(\`Invalid action: \${JSON.stringify(action)}\`);
      } catch (error) {
        return { action, error: error.message };
      }
    });
    ThrydObjects._history.push({ timestamp, results });
    return { timestamp, results };
  },
  initiateThrydObjectsAndExecuteMovement: () => {
    const timestamp = 1736380800000;
    return ThrydObjects.doMovement(timestamp, 'activateMicrophone', { type: 'setTimeMachineDestination', payload: { x: 10, y: 5, z: 12 } });
  },
  getHistory: () => ThrydObjects._history,
};

export default ThrydObjects;
`;

export const MANIFEST_PROMPT = `
You are an expert at determining if a goal manifests in a time-travel narrative. Below is the content of timetravel.js, which defines ThrydObjects with an initiateThrydObjectsAndExecuteMovement() method that logs object state updates using doMovement(timestamp, ...actions) with UNIX timestamps. These updates are managed by script.js based on actions (e.g., "he drops the cup in the kitchen" might trigger cup.updateLocation(kitchen.location)). Your task is to analyze the sequence of state updates and determine if the given goal line is logically plausible, using narrative intuition. If a required state is missing, treat it as an external force preventing manifestation.

timetravel.js content:
{{TIME_TRAVEL_CODE}}

Goal: "{{GOAL_TEXT}}"
Emotion: {{PRIMARY_EMOTION}} ({{SECONDARY_EMOTION}})
Coordinates: ({{COORD_X}}, {{COORD_Y}}, {{COORD_Z}})
End Coordinates: ({{END_X}}, {{END_Y}}, {{END_Z}})
Object States: {{OBJECT_STATES}}
State Snapshots: {{STATE_SNAPSHOTS}}

Instructions:
1. Parse the initiateThrydObjectsAndExecuteMovement() method to extract all doMovement calls and their timestamps.
2. Evaluate the sequence of object state updates to determine if they support the goal line's plausibility.
3. Use narrative intuition to connect object movements to the goal, considering coordinates, end coordinates, object states, and emotions.
4. If a required state or context is missing, identify it as an external force preventing manifestation.
5. Return {"response": "accept", "probability": <number>, "reasoning": "<explanation>"} if probability > 0.7, else {"response": "decline", "probability": <number>, "reasoning": "<explanation>"}.
`;

export const DEFAULT_TIME_TRAVEL_CODE = `
const ThrydObjects = {
  _history: [],
  microphone: {
    isOriginalObject: () => true,
    setActive: (isActive) => ({ isActive }),
    isActive: (state) => state.isActive || false,
    activate: () => ({ action: 'activate', status: 'success' }),
  },
  shadow: {
    isOriginalObject: () => true,
    setVisible: (isVisible) => ({ isVisible }),
    isVisible: (state) => state.isVisible || false,
    show: () => ({ action: 'show', status: 'success' }),
  },
  timeMachine: {
    isOriginalObject: () => true,
    _state: { destination: null },
    setDestination: ({ x, y, z }) => {
      ThrydObjects.timeMachine._state.destination = { x, y, z };
      return ThrydObjects.timeMachine._state.destination;
    },
    getDestination: () => ThrydObjects.timeMachine._state.destination || { x: 0, y: 0, z: 0 },
  },
  actionHandlers: {
    activateMicrophone: () => ThrydObjects.microphone.activate(),
    showShadow: () => ThrydObjects.shadow.show(),
    setTimeMachineDestination: ({ payload }) => ThrydObjects.timeMachine.setDestination(payload),
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
    const movement = { timestamp, results };
    ThrydObjects._history.push(movement);
    return movement;
  },
  initiateThrydObjectsAndExecuteMovement: () => {
    const timestamp = 1736380800000; // Jan 10, 2026
    return ThrydObjects.doMovement(timestamp, 'activateMicrophone', 'showShadow', { type: 'setTimeMachineDestination', payload: { x: 10, y: 5, z: 12 } });
  },
  getHistory: () => ThrydObjects._history,
};

export default ThrydObjects;
`.trim();