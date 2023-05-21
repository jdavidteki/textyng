// import React, { useEffect, useRef } from 'react';
// import { WebAudioRecorder } from 'web-audio-recorder-js';

// const ModelsSpeech = ({ models }) => {
//   const recorderRef = useRef(null);

//   useEffect(() => {
//     // Initialize the recorder when the component mounts
//     recorderRef.current = new WebAudioRecorder();

//     return () => {
//       // Clean up the recorder when the component unmounts
//       if (recorderRef.current) {
//         recorderRef.current.destroy();
//         recorderRef.current = null;
//       }
//     };
//   }, []);

//   const handlePlayback = async () => {
//     if (!recorderRef.current) {
//       console.error('Recorder is not initialized');
//       return;
//     }

//     // Start recording
//     await recorderRef.current.start();

//     // Play the utterances
//     for (const model of models) {
//       const utterance = `Model ${model.index}: ${model.name}`;
//       await speakUtterance(utterance);
//     }

//     // Stop recording
//     const recording = await recorderRef.current.stop();

//     // Create an audio element to play the recording
//     const audioElement = new Audio();
//     audioElement.src = recording.url;
//     audioElement.play();
//   };

//   const speakUtterance = (utterance) => {
//     return new Promise((resolve) => {
//       const speechSynthesis = window.speechSynthesis;
//       const utteranceObj = new SpeechSynthesisUtterance(utterance);

//       utteranceObj.onend = resolve;

//       speechSynthesis.speak(utteranceObj);
//     });
//   };

//   return (
//     <div>
//       <button onClick={handlePlayback}>Play Utterances</button>
//     </div>
//   );
// };

// export default ModelsSpeech;








// // import React, { useEffect, useRef } from 'react';

// // const ModelsSpeech = ({ models }) => {
// //   const audioRefs = useRef([]);

// //   useEffect(() => {
// //     audioRefs.current = audioRefs.current.slice(0, models.length); // Ensure the correct number of audio references

// //     models.forEach((model, index) => {
// //       const text = `Model ${index + 1}: ${model.name}`;
// //       const utterance = new SpeechSynthesisUtterance(text);
// //       utterance.volume = Math.random(); // Randomize volume for each model
// //     //   speechSynthesis.speak(utterance);
// //     });


// //     models.forEach((model, index) => {
// //         const text = `Model ${index + 1}: ${model.name}`;
// //         const utterance = new SpeechSynthesisUtterance(text);
// //         utterance.volume = Math.random(); // Randomize volume for each model
// //         // speechSynthesis.speak(utterance);
// //       })
// //   }, [models]);

// //   return (<div>testing</div>); // No need to render anything
// // };

// // export default ModelsSpeech;





// // import React, { useEffect, useState } from 'react';
// // import Speech from 'react-speech';

// // const ModelsSpeech = ({ models }) => {
// //   const [currentSet, setCurrentSet] = useState(0);

// //   useEffect(() => {
// //     const timer = setTimeout(() => {
// //       playNextSet();
// //     }, 1000); // Adjust the delay (in milliseconds) between each set of audios

// //     return () => {
// //       clearTimeout(timer); // Cleanup the timer on component unmount
// //     };
// //   }, [currentSet]);

// //   const playNextSet = () => {
// //     setCurrentSet((prevSet) => {
// //       const nextSet = prevSet + 1;
// //       const playButton = document.querySelectorAll('.rs-play')[nextSet - 1];
  
// //       if (playButton) {
// //         // simulateClick(playButton);
// //       }
  
// //       return nextSet;
// //     });
// //   };
  
// //   const simulateClick = (element) => {
// //     if (element) {
// //       const event = new MouseEvent('click', {
// //         view: window,
// //         bubbles: true,
// //         cancelable: true,
// //       });
// //       element.dispatchEvent(event);
// //     }
// //   };

// //   return (
// //     <>
// //       {models.map((model, index) => (
// //         <div key={model.name} style={{ display: 'none' }}>
// //           <Speech
// //             text={`Model ${index + 1}: ${model.name}`}
// //             volume={Math.random()} // Randomize volume for each model
// //             pitch={1}
// //             rate={1}
// //             lang="en-US"
// //             autostart={false} // Disable autoplay
// //           />
// //         </div>
// //       ))}
// //     </>
// //   );
// // };

// // export default ModelsSpeech;






// // import React, { useEffect } from 'react';
// // import Speech from 'react-speech';

// // const ModelsSpeech = ({ models }) => {
// //   useEffect(() => {
// //     const playAllAudios = () => {
// //       const playButtons = document.querySelectorAll('.rs-play');
// //       playButtons.forEach((playButton) => {
// //         simulateClick(playButton);
// //       });
// //     };

// //     playAllAudios();
// //   }, []);

// //   const simulateClick = (element) => {
// //     if (element) {
// //       const event = new MouseEvent('click', {
// //         view: window,
// //         bubbles: true,
// //         cancelable: true,
// //       });
// //       element.dispatchEvent(event);
// //     }
// //   };

// //   return (
// //     <>
// //       {models.map((model, index) => (
// //         <div key={model.name} style={{ display: 'none' }}>
// //           <Speech
// //             text={`Model ${index + 1}: ${model.name}`}
// //             volume={Math.random()} // Randomize volume for each model
// //             pitch={1}
// //             rate={1}
// //             lang="en-US"
// //             autostart={true} // Enable autoplay
// //           />
// //         </div>
// //       ))}
// //     </>
// //   );
// // };

// // export default ModelsSpeech;
