import React from "react";

import TextField from "@material-ui/core/TextField";

import "./EditableField.css";

function EditableField(props) {
  let oldName = "textyng"

  if(props.name){
    oldName = props.name
  }
  const [name, setName] = React.useState(oldName);
  const [isNameFocused, setIsNamedFocused] = React.useState(false);

  function onBlurFunction(){
    setIsNamedFocused(false)
    props.getScriptName([props.id, name])
  }

  return (
    <div className="EditableField">
      {!isNameFocused ? (
        <div
          onClick={() => {
            setIsNamedFocused(true);
          }}
        >
          {name}
        </div>
      ) : (
        <TextField
          autoFocus
          inputProps={{maxLength: 12, style: {fontSize: props.fontSize ? props.fontSize : 50}}}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={(event) => onBlurFunction()}

        />
      )}
    </div>
  );
}

export default EditableField;
