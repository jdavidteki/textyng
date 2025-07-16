import firebase from "../../firebase/firebase.js";

const ThrydObjects = {
  _state: {
    tunde: { location: { x: 0, y: 0, z: 0 } },
    kitchen: { location: { x: 5, y: 5, z: 0 } },
    door: { isClosed: true },
    timeMachine: { destination: { x: 0, y: 0, z: 0 } },
    controlPanel: { active: false },
  },

  actionHandlers: {
    newlocation: ({ context, x, y, z, coordinates }) => {
      try {
        let coords = coordinates || { x, y, z };
        if (!context || !coords || typeof coords.x !== "number" || typeof coords.y !== "number" || typeof coords.z !== "number") {
          throw new Error("Invalid context or coordinates: must provide context and numeric x, y, z or a coordinates object");
        }
        ThrydObjects._state[context] = ThrydObjects._state[context] || {};
        ThrydObjects._state[context].location = coords;
        console.log(`Updated ${context} location to:`, coords);
        return { action: "newlocation", result: { context, coordinates: coords } };
      } catch (error) {
        console.error("Error in actionHandlers.newlocation:", error);
        firebase.logError({
          type: "CommandError",
          message: `Invalid context or coordinates: ${error.message}`,
          command: `${context}.newlocation(${JSON.stringify(coordinates || { x: x || 'undefined', y: y || 'undefined', z: z || 'undefined' })})`,
          timestamp: Date.now(),
        }).catch(err => console.error("Failed to log Firebase error:", err));
        return { error: `Invalid context or coordinates: ${error.message}` };
      }
    },
    openDoor: ({ context }) => {
      if (!context || !ThrydObjects._state[context]) {
        return { error: "Invalid context or state not initialized" };
      }
      ThrydObjects._state.door = ThrydObjects._state.door || {};
      ThrydObjects._state.door.isClosed = false;
      return { action: "openDoor", result: { context, isClosed: false } };
    },
    setTimeMachineDestination: ({ context, destination }) => {
      if (!context || !destination || typeof destination.x !== "number" || typeof destination.y !== "number" || typeof destination.z !== "number") {
        return { error: "Invalid context or destination" };
      }
      ThrydObjects._state.timeMachine = ThrydObjects._state.timeMachine || {};
      ThrydObjects._state.timeMachine.destination = destination;
      return { action: "setTimeMachineDestination", result: { context, destination } };
    },
    activateControlPanel: ({ context }) => {
      if (!context || !ThrydObjects._state[context]) {
        return { error: "Invalid context or state not initialized" };
      }
      ThrydObjects._state.controlPanel = ThrydObjects._state.controlPanel || {};
      ThrydObjects._state.controlPanel.active = true;
      return { action: "activateControlPanel", result: { context, active: true } };
    },
    getlocation: ({ context }) => {
      if (context === 'thrydobject') {
        return { error: "thrydobject does not support getlocation" };
      }
      if (!context || !ThrydObjects[context] || !ThrydObjects[context].getlocation) {
        return { error: `Invalid context or getlocation not supported: ${context}` };
      }
      const location = ThrydObjects[context].getlocation();
      return { action: "getlocation", result: { context, location } };
    },
    executeCommand: ({ command }) => ThrydObjects.parseCommand(command),
  },

  tunde: {
    isOriginalObject: function() { return false; },
    newlocation: function(coords) {
      if (!coords || typeof coords !== 'object' || !('x' in coords && 'y' in coords && 'z' in coords)) {
        throw new Error('Invalid coordinates');
      }
      ThrydObjects._state.tunde = ThrydObjects._state.tunde || {};
      ThrydObjects._state.tunde.location = { x: coords.x, y: coords.y, z: coords.z };
      return { action: 'newlocation', status: 'success', location: ThrydObjects._state.tunde.location };
    },
    getlocation: function() {
      return (ThrydObjects._state.tunde || {}).location || { x: 0, y: 0, z: 0 };
    },
  },

  kitchen: {
    isOriginalObject: function() { return false; },
    getlocation: function() {
      return (ThrydObjects._state.kitchen || {}).location || { x: 5, y: 5, z: 0 };
    },
  },

  door: {
    isOriginalObject: function() { return true; },
    setIsClosed: function(isClosed) {
      ThrydObjects._state.door = ThrydObjects._state.door || {};
      ThrydObjects._state.door.isClosed = isClosed;
      return { isClosed };
    },
    isClosed: function() {
      return (ThrydObjects._state.door || {}).isClosed || false;
    },
    open: function() {
      ThrydObjects._state.door = ThrydObjects._state.door || {};
      ThrydObjects._state.door.isClosed = false;
      return { action: 'open', status: 'success' };
    },
  },

  timeMachine: {
    isOriginalObject: function() { return true; },
    setDestination: function({ x, y, z }) {
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        throw new Error('Invalid destination coordinates');
      }
      ThrydObjects._state.timeMachine = ThrydObjects._state.timeMachine || {};
      ThrydObjects._state.timeMachine.destination = { x, y, z };
      return ThrydObjects._state.timeMachine.destination;
    },
    getDestination: function() {
      return (ThrydObjects._state.timeMachine || {}).destination || { x: 0, y: 0, z: 0 };
    },
  },

  controlPanel: {
    isOriginalObject: function() { return false; },
    activate: function() {
      ThrydObjects._state.controlPanel = ThrydObjects._state.controlPanel || {};
      ThrydObjects._state.controlPanel.active = true;
      return { action: 'activate', status: 'success' };
    },
  },

  async saveCommandToFirebase(heavenId, command, timestamp) {
    try {
      await firebase.saveStateUpdateCommands(heavenId, command, timestamp);
    } catch (error) {
      console.error("Failed to save command to Firebase:", error);
      await firebase.logError({
        type: "FirebaseSaveError",
        message: `Failed to save command: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
      throw error;
    }
  },

  parseCommand(command) {
    try {
      if (!command || typeof command !== 'string') {
        return { error: "Command must be a non-empty string" };
      }
      const match = command.match(/^\s*(\w+)\s*\.\s*(\w+)\s*\((.*)\)\s*;?\s*$/);
      if (!match) {
        return { error: "Invalid command format. Expected: context.action(params);" };
      }
      const [, objId, method, args] = match;
      if (!ThrydObjects[objId] && objId !== 'thrydobject') {
        return { error: `Object ${objId} not found` };
      }
      if (objId === 'thrydobject' && method === 'getlocation') {
        return { error: "thrydobject does not support getlocation" };
      }

      let parsedArgs = args ? eval("(" + args + ")") : undefined;

      const target = objId === 'thrydobject' ? ThrydObjects : ThrydObjects[objId];
      if (!target[method] && !ThrydObjects.actionHandlers[method]) {
        return { error: `Method ${method} not found on ${objId}` };
      }
      const result = ThrydObjects.actionHandlers[method]
        ? ThrydObjects.actionHandlers[method]({ context: objId, ...parsedArgs })
        : target[method](parsedArgs);
      return { context: objId, action: method, result };
    } catch (error) {
      console.error("Error parsing command:", error, command);
      firebase.logError({
        type: "ParseError",
        message: `Parse error: ${error.message}`,
        command,
        timestamp: Date.now(),
      }).catch(err => console.error("Failed to log Firebase error:", err));
      return { error: `Parse error: ${error.message}`, command };
    }
  },

  async getHistory(heavenId, limit = 50) {
    try {
      const val = await firebase.getMoveHistory(heavenId, limit);
      return val;
    } catch (error) {
      console.error("Failed to fetch command history:", error);
      await firebase.logError({
        type: "FirebaseFetchError",
        message: `Failed to fetch command history: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
      return [];
    }
  },

  async doMovement(heavenId, timestamp, actionObj) {
    const results = [];
    if (!actionObj || !actionObj.command) {
      results.push({ error: "No command provided" });
      return { results };
    }

    const parsed = this.parseCommand(actionObj.command);
    if (parsed.error) {
      results.push({ error: parsed.error, command: actionObj.command });
      return { results };
    }

    const { context, action, result } = parsed;
    try {
      if (!result.error) {
        await this.saveCommandToFirebase(heavenId, actionObj.command, timestamp);
        results.push(result);
      } else {
        results.push({ error: result.error, command: actionObj.command });
      }
    } catch (error) {
      console.error("Error executing action:", error, { command: actionObj.command, context, action });
      results.push({ error: error.message, command: actionObj.command });
      await firebase.logError({
        type: "ActionExecutionError",
        message: `Failed to execute action ${action} for ${context}: ${error.message}`,
        heavenId,
        timestamp,
      });
    }

    return { results };
  },

  async initiateThrydObjectsAndExecuteMovement(heavenId) {
    try {
      this._state = {
        tunde: { location: { x: 0, y: 0, z: 0 } },
        kitchen: { location: { x: 5, y: 5, z: 0 } },
        door: { isClosed: true },
        timeMachine: { destination: { x: 0, y: 0, z: 0 } },
        controlPanel: { active: false },
      };
      const commands = await this.getHistory(heavenId);
      console.debug(`Replaying ${commands.length} commands for heaven ${heavenId}`);
      for (const { command, timestamp } of commands) {
        const result = await this.doMovement(heavenId, timestamp, { command });
        if (result.results[0].error) {
          console.error(`Failed to replay command: ${command}`, result.results[0].error);
          await firebase.logError({
            type: "ReplayError",
            message: `Failed to replay command ${command}: ${result.results[0].error}`,
            heavenId,
            timestamp: Date.now(),
          });
        }
      }

    } catch (error) {
      console.error("Failed to initialize ThrydObjects:", error);
      await firebase.logError({
        type: "InitializationError",
        message: `Failed to initialize ThrydObjects: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
    }
  },

  viewrecentmoves: function(count) {
    if (typeof count !== 'number' || count < 1) {
      return { action: 'viewrecentmoves', status: 'error', error: 'Invalid count' };
    }
    return this.getHistory(null, count).then(commands => {
      const summary = commands.map(({ command, timestamp }) => {
        const parsed = this.parseCommand(command);
        if (parsed.error) {
          return `${timestamp}: ${command} -> Failed (${parsed.error})`;
        }
        const { context, action, result } = parsed;
        if (result.status === 'success' || action === 'getlocation') {
          if (action === 'newlocation' || action === 'getlocation') {
            return `${context}: ${action} -> Succeeded (Location: ${JSON.stringify(result.location)})`;
          }
          return `${context}: ${action} -> Succeeded`;
        }
        return `${context}: ${action} -> Failed (${result.error || 'Unknown error'})`;
      });
      return { action: 'viewrecentmoves', status: 'success', moves: summary.join('\n') };
    });
  },

  getState: function() { return this._state; },
  setState: function(state) { this._state = state; },
};

export default ThrydObjects;