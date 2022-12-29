import React from 'react';
import { Recorder } from 'react-voice-recorder';
import Firebase from "../../firebase/firebase.js";

import './RecordModal.css';
import "react-voice-recorder/dist/index.css";

function RecordModal(props) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState(null);

  function handleStartRecording() {
    setIsRecording(true);
  }

  function handleStopRecording(blob) {
    setIsRecording(false);
    setAudioUrl(blob.blobURL);
    const milliseconds = Math.floor(Date.now() / 1000)
    const storageRef = Firebase.storage().ref("VoiceNotes/" + milliseconds);

    // Upload the audio to Firebase
    const audioFile = new File([blob.blob], milliseconds.toString()+'audio.mp3', {
        type: 'audio/mp3',
        metadata: {
            cors: [{
              origin: ['http://localhost:19006'],
            }],
        },
    });

    storageRef.put(audioFile).then(snapshot => {
        console.log('Audio uploaded to Firebase');
        snapshot.ref.getDownloadURL().then(url => {
            console.log("url", url)
            props.getVNURL(url)
        });
    });

  }

  return (
    <div className="RecordModal">
      {isRecording ? (
        <div className="RecordModal-modalPopup">
            <Recorder handleAudioStop={handleStopRecording} />
        </div>
      ) : (
        <button onClick={handleStartRecording} className="RecordModal-recordBbutton">
          Start recording
        </button>
      )}
      {audioUrl && (
        <div>
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}

export default RecordModal;