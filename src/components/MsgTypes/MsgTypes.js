import React from "react";
import FilePicker from "../FilePicker/FilePicker.js"
import RecordModal from "../RecordModal/RecordModal.js"

import "./MsgTypes.css";

function MsgTypes(props) {
  let msgTypes = [
    "Is Typing",
    "Left Chat",
  ];

  return (
    <div className="MsgTypes">
      <div
        className={"MsgTypes-name"}
        onClick={() => props.grabScreenshot()}
      >
        Screen Shot
      </div>
      <div className={"MsgTypes-name"}>
        <FilePicker
          msgType="Insert Image"
          getImgURL={props.getInsertedImg}
        />
      </div>
      <div className={"MsgTypes-name"}>
        <RecordModal
          msgType="Voice Note"
          getVNURL={props.getVNURL}
        />
      </div>
      <div className={"MsgTypes-name"}>
        <FilePicker
          msgType="Upload Video"
          getImgURL={props.getUplodedVideo}
        />
      </div>
      {msgTypes.map((value, index) => (
        <div
          id={"MsgTypes-id-" + index}
          className={"MsgTypes-name"}
          key={index}
          onClick={() => props.selectedMsgType ? props.selectedMsgType(value) : {}}
        >
          {value}
        </div>
      ))}
    </div>
  );
}

export default MsgTypes;
