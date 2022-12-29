import React, { useState, useEffect } from 'react';
import { storage } from 'firebase'; // import the Firebase Storage API

function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Initialize the Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioStream = null;
  let audioRecorder = null;

  // Function to start recording audio
  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioStream = stream;

      const input = audioContext.createMediaStreamSource(stream);
      input.connect(audioContext.destination);

      audioRecorder = new MediaRecorder(input);
      audioRecorder.start();

      const audioChunks = [];
      audioRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      audioRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        setAudioBlob(audioBlob);
      });

      setRecording(true);
    });
  };

  // Function to stop recording audio
  const stopRecording = () => {
    audioRecorder.stop();
    audioStream.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  // Function to push the recorded audio to Firebase Storage
  const pushToStorage = () => {
    if (audioBlob) {
      const storageRef = storage().ref();
      const audioRef = storageRef.child('audio/' + Date.now() + '.mp3');
      audioRef.put(audioBlob).then(() => {
        audioRef.getDownloadURL().then((url) => {
          setAudioUrl(url);
        });
      });
    }
  };

  // Function to play the audio
  const playAudio = () => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioElement.play();
    }
  };

  // Use effect hook to cleanup the audio context and audio stream when the component unmounts
  useEffect(() => {
    return () => {
      audioContext.close();
      audioStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div>
      {!recording && (
        <button onClick={startRecording}>Start Recording</button>
      )}
      {recording && (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
      {audioBlob && (
        <button onClick={pushToStorage}>Push to Storage</button>
      )}
      {audioUrl && (
        <button onClick={playAudio}>Play Audio</button>
      )}
    </div>
  );
}

export default AudioRecorder;