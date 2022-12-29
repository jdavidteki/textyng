import React, { useRef } from 'react';
import Firebase from "../../firebase/firebase.js";

import "./FilePicker.css"

const FilePicker = (props) => {
  const fileInput = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    const storageRef = Firebase.storage().ref(props.msgType.replace(/ /g, "") + "/");
    const fileRef = storageRef.child(file.name);
    fileRef.put(file).then(() => {
      fileRef.getDownloadURL().then(url => {
        props.getImgURL(url)
      });
    });
  }
  return (
    <div className="FilePicker">
        <span>{props.msgType}</span>
        <input
          type="file"
          ref={fileInput}
          onChange={handleFileSelect}
        />
    </div>
  );
}

export default FilePicker;
