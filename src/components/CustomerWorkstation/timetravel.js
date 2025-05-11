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
    activate: () => ({ action: 'activate', status: 'success' }),
  },
  actionHandlers: {
    openDoor: () => ThrydObjects.door.open(),
    setTimeMachineDestination: ({ payload }) => ThrydObjects.timeMachine.setDestination(payload),
    activateControlPanel: () => ThrydObjects.controlPanel.activate(),
  },
  doMovement: (timestamp, ...actions) => {
    console.log('Executing actions at timestamp ' + timestamp + ':');
    const results = actions.map((action) => {
      try {
        if (typeof action === 'string') {
          if (ThrydObjects.actionHandlers[action]) {
            return { action, result: ThrydObjects.actionHandlers[action]() };
          } else {
            throw new Error('Invalid action: ' + action);
          }
        } else if (action.type && ThrydObjects.actionHandlers[action.type]) {
          return { action: action.type, result: ThrydObjects.actionHandlers[action.type](action) };
        } else {
          throw new Error('Invalid action object: ' + JSON.stringify(action));
        }
      } catch (error) {
        return { action, error: error.message };
      }
    });
    return { timestamp, results };
  },
};

function initiateThrydObjectsAndExecuteMovement() {
  const timestamp = 1715324160000;
  ThrydObjects.doMovement(timestamp, 'openDoor', { type: 'setTimeMachineDestination', payload: { x: 10, y: 20, z: 30 } });
}

export default initiateThrydObjectsAndExecuteMovement;