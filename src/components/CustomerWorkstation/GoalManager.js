import React from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import ManifestButton from "./ManifestButton.js";

import "./CustomerWorkstation.css";

const GoalManager = ({
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
  onGoalSelect,
  onCloseGoalSection,
  onManifest,
  onSaveScriptToJson,
  onSaveStateToFile,
  setState,
}) => {
  if (!heaven || !script || !cast || !scenes) {
    return <div className="CustomerWorkstation--loading-message">Loading your journey...</div>;
  }

  return (
    <div className="GoalManager">
      {timeMachineDestination && (
        <p className="CustomerWorkstation--time-machine-destination">
          Time Machine Destination: x={timeMachineDestination.x}, y={timeMachineDestination.y}, z={timeMachineDestination.z}
        </p>
      )}
      {movementHistory.length > 0 && (
        <div className="CustomerWorkstation--movement-history">
          <h4>Movement History</h4>
          <ul>
            {movementHistory.map((movement, index) => (
              <li key={`movement-${index}`}>
                Timestamp: {new Date(movement.timestamp).toLocaleString()} - Actions: {movement.results.map(r => r.action).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormControl className="CustomerWorkstation--goal-select">
        <InputLabel>Select Your Goal</InputLabel>
        <Select
          value={selectedGoalId ?? ''}
          onChange={(e) => onGoalSelect(e.target.value === '' ? null : parseInt(e.target.value))}
        >
          <MenuItem value="">Select a goal</MenuItem>
          {heaven.getLines().map((line, index) => (
            <MenuItem key={`goal-${index}`} value={index}>
              {line.text} ({line.coordinates ? `x:${line.coordinates.x}, y:${line.coordinates.y}, z:${line.coordinates.z}` : 'default'})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedGoalId !== null && (
        <div className="CustomerWorkstation--goal-section">
          <Button
            variant="outlined"
            onClick={onCloseGoalSection}
            className="CustomerWorkstation--close-button"
          >
            X
          </Button>
          <p className="CustomerWorkstation--place-info">
            Coordinates: {heaven.getLines()[selectedGoalId].coordinates ? 
              `(${heaven.getLines()[selectedGoalId].coordinates.x}, ${heaven.getLines()[selectedGoalId].coordinates.y}, ${heaven.getLines()[selectedGoalId].coordinates.z})` : 'default'}
          </p>
          <p className="CustomerWorkstation--character-object-info">
            Character: {selectedCharacter || 'None'} | Object: {selectedObject || 'None'}
          </p>
          {activeAction === null && (
            <div className="CustomerWorkstation--button-group">
              <Button
                variant="contained"
                onClick={() => setState({ activeAction: 'manifest' })}
              >
                Manifest
              </Button>
              <Button
                variant="contained"
                onClick={onSaveScriptToJson}
              >
                Save to File
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const ThrydObjects = (await import('./timetravel.js')).default;
                  const destination = ThrydObjects.timeMachine.getDestination();
                  console.log('Manually fetched destination:', destination);
                  alert(`Destination: x=${destination.x}, y=${destination.y}, z=${destination.z}`);
                }}
              >
                Get Time Machine Destination
              </Button>
            </div>
          )}
          {activeAction === 'manifest' && (
            <ManifestButton
              isValidating={isValidating}
              onManifest={onManifest}
              onSaveState={onSaveStateToFile}
              onBack={() => setState({ activeAction: null })}
            />
          )}

          <div className="CustomerWorkstation--chat-area">
            {allMessages
              .filter(msg => msg.sceneId === selectedSceneId)
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
                      const newActions = [...manifestationActions];
                      newActions[index].save = !newActions[index].save;
                      setState({ manifestationActions: newActions });
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
                      const newActions = [...manifestationActions];
                      newActions.splice(index, 1);
                      setState({ manifestationActions: newActions });
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
    </div>
  );
};

export default GoalManager;