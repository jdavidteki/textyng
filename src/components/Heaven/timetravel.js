const ThrydObjects = {
  _history: [
    {
      timestamp: "1693526400000",
      results: [
        {
          action: "executeCommand",
          result: {
            context: "user1",
            action: "tunde.newlocation",
            result: {
              action: "newlocation",
              status: "success",
              location: { x: 2, y: 3, z: 0 }
            }
          }
        },
        {
          action: "openDoor",
          result: { action: "open", status: "success" }
        }
      ]
    },
    {
      timestamp: "1693526500000",
      results: [
        {
          action: "executeCommand",
          result: {
            context: "user2",
            action: "timeMachine.setDestination",
            result: { x: 10, y: 20, z: 30 }
          }
        },
        {
          action: "activateControlPanel",
          result: { action: "activate", status: "success" }
        }
      ]
    }
  ],
  _state: {},

  tunde: {
    isOriginalObject: function() { return false; },
    _state: { location: { x: 0, y: 0, z: 0 } },
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
    }
  },

  kitchen: {
    isOriginalObject: function() { return false; },
    _state: { location: { x: 5, y: 5, z: 0 } },
    getlocation: function() {
      return (ThrydObjects._state.kitchen || {}).location || { x: 5, y: 5, z: 0 };
    }
  },

  door: {
    isOriginalObject: function() { return true; },
    setIsClosed: function(isClosed) { return { isClosed }; },
    isClosed: function(state) { return state.isClosed || false; },
    open: function() { return { action: 'open', status: 'success' }; }
  },

  timeMachine: {
    isOriginalObject: function() { return true; },
    _state: { destination: null },
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
    }
  },

  controlPanel: {
    isOriginalObject: function() { return false; },
    activate: function() { return { action: 'activate', status: 'success' }; }
  },

  viewrecentmoves: function(count) {
    if (typeof count !== 'number' || count < 1) {
      return { action: 'viewrecentmoves', status: 'error', error: 'Invalid count' };
    }
    const history = ThrydObjects._history.slice(-count);
    const summary = history.map(move => {
      const result = move.results[0];
      if (result.action === 'executeCommand' && result.result) {
        const { context, action, result: { action: method, status, location } } = result.result;
        if (status === 'success') {
          if (method === 'newlocation') {
            return `${context}: ${action} -> Succeeded (Location: ${JSON.stringify(location)})`;
          }
          return `${context}: ${action} -> Succeeded`;
        }
        return `${context}: ${action} -> Failed (${result.error || 'Unknown error'})`;
      }
      return `${move.timestamp}: ${result.action} -> ${result.error ? `Failed (${result.error})` : 'Succeeded'}`;
    });
    return { action: 'viewrecentmoves', status: 'success', moves: summary.join('\n') };
  },

  parseCommand: function(command) {
    try {
      const [context, action] = command.split(':').map(s => s.trim());
      if (!action) throw new Error('Invalid command format');

      const match = action.match(/^(\w+)\.(\w+)\((.*)\)$/);
      if (!match) throw new Error('Unsupported command syntax');

      const [, objId, method, args] = match;
      if (!ThrydObjects[objId] && objId !== 'thrydobject') throw new Error(`Object ${objId} not found`);

      let parsedArgs;
      if (args) {
        const argMatch = args.match(/^(\w+)\.(\w+)\(\)$/);
        if (argMatch) {
          const [, argObjId, argMethod] = argMatch;
          if (!ThrydObjects[argObjId]) throw new Error(`Object ${argObjId} not found`);
          parsedArgs = ThrydObjects[argObjId][argMethod]();
        } else {
          try {
            parsedArgs = JSON.parse(args.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
          } catch (e) {
            parsedArgs = parseInt(args, 10);
            if (isNaN(parsedArgs)) throw new Error(`Invalid argument format: ${e.message}`);
          }
        }
      }

      const target = objId === 'thrydobject' ? ThrydObjects : ThrydObjects[objId];
      if (!target[method]) throw new Error(`Method ${method} not found on ${objId}`);
      const result = target[method](parsedArgs);
      if (method === 'getHistory') {
        // Deep copy to avoid circular references
        const historyCopy = JSON.parse(JSON.stringify(result));
        return { context, action, result: { action: 'getHistory', status: 'success', history: historyCopy } };
      }
      return { context, action, result };
    } catch (error) {
      return { command, error: error.message };
    }
  },

  actionHandlers: {
    openDoor: function() { return ThrydObjects.door.open(); },
    setTimeMachineDestination: function({ payload }) { return ThrydObjects.timeMachine.setDestination(payload); },
    activateControlPanel: function() { return ThrydObjects.controlPanel.activate(); },
    executeCommand: function({ command }) { return ThrydObjects.parseCommand(command); }
  },

  doMovement: function(timestamp, ...actions) {
    const results = actions.map((action) => {
      try {
        if (typeof action === 'string') {
          if (ThrydObjects.actionHandlers[action]) {
            return { action, result: ThrydObjects.actionHandlers[action]() };
          } else {
            throw new Error(`Invalid action: ${action}`);
          }
        } else if (action.type && ThrydObjects.actionHandlers[action.type]) {
          return { action: action.type, result: ThrydObjects.actionHandlers[action.type](action) };
        } else {
          throw new Error(`Invalid action object: ${JSON.stringify(action)}`);
        }
      } catch (error) {
        return { action: action.type || action, error: error.message };
      }
    });
    const movement = { timestamp, results };
    // Skip adding to _history for getHistory to avoid self-references
    if (!results.some(r => r.result && r.result.action === 'getHistory')) {
      ThrydObjects._history.push(movement);
    }
    return movement;
  },

  initiateThrydObjectsAndExecuteMovement: function() {
    const timestamp = parseInt(Date.now() / 1000, 10);
    ThrydObjects._state.tunde = { location: { x: 0, y: 0, z: 0 } };
    ThrydObjects._state.kitchen = { location: { x: 5, y: 5, z: 0 } };
    ThrydObjects._state.timeMachine = { destination: { x: 0, y: 0, z: 0 } };
    return ThrydObjects.doMovement(timestamp, 'openDoor', { type: 'setTimeMachineDestination', payload: { x: 10, y: 20, z: 30 } });
  },

  getHistory: function() {
    // Return a deep copy to avoid modifying _history
    return JSON.parse(JSON.stringify(ThrydObjects._history));
  },

  getState: function() { return ThrydObjects._state; },
  setState: function(state) { ThrydObjects._state = state; }
};

ThrydObjects.initiateThrydObjectsAndExecuteMovement();

export default ThrydObjects;