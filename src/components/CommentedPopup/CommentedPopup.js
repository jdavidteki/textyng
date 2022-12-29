import React, { useState } from 'react';
import TextField from "@material-ui/core/TextField";

import "./CommentedPopup.css"

function CommentedPopup(props) {
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState(props.alreadySavedValue);

  const handleShow = () => {
    setIsVisible(true);
  };

  const handleSave = () => {
    props.onSave(inputValue, props.idOfMsgCommented, props.whoSentCommentedMsg);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="parent-element">
      {isVisible && (
        <div id="popup">
          <div id="popup-content">
            <TextField
              variant="outlined"
              value={inputValue}
              placeholder="Type comment here"
              onChange={e => handleInputChange(e)}
              multiline
              minRows={4}
            />
            <button id="save" onClick={handleSave}>Save</button>
            <button id="close" onClick={handleClose}>&times;</button>
          </div>
        </div>
      )}
      <button id="commented-button" onClick={handleShow}>comment</button>
    </div>
  );
}

export default CommentedPopup;
