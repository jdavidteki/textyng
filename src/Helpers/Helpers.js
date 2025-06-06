import React, { Component } from "react";

export function GetSvgIcon(iconName, fillColor) {
    if (iconName == "createIcon"){
        return (
            <svg data-name="Layer 1" fill={fillColor} xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 60 60">
                <defs></defs>
                <title>Thinking</title>
                <g id="TSizNs.tif">
                    <path className="cls-1" d="M55.3,36.65v.9l0,.15c-.05.33-.08.67-.15,1a8.41,8.41,0,0,1-1.81,3.38,9.42,9.42,0,0,1-2.13,1.85.23.23,0,0,0-.11.24c0,.2,0,.4.07.6a9.07,9.07,0,0,1-.2,3.07,5.4,5.4,0,0,1-1.57,2.77,8.37,8.37,0,0,1-3.88,1.84,4.68,4.68,0,0,0-1.58.32.56.56,0,0,0-.2.17c-.22.33-.4.69-.63,1a7.5,7.5,0,0,1-2,2,8.09,8.09,0,0,1-3,1.06l-1.17.22H35.63L35,57.18a5.8,5.8,0,0,1-2.8-1.31l-.24-.2-.13.12a5.83,5.83,0,0,1-2.72,1.35c-.25,0-.51.08-.77.11h-.83l-.17,0c-.59-.08-1.19-.12-1.78-.24a7.53,7.53,0,0,1-2.55-1,7.82,7.82,0,0,1-2.84-3.19.36.36,0,0,0-.34-.22,10.57,10.57,0,0,1-3.49-.85,5.59,5.59,0,0,1-3.18-3.38,9.15,9.15,0,0,1-.28-4.19.23.23,0,0,0-.11-.27,11,11,0,0,1-2.4-2.16,7.22,7.22,0,0,1-1.66-5.53,9.36,9.36,0,0,1,1.39-4c.12-.2.32-.38.34-.59s-.14-.42-.23-.63a20.7,20.7,0,0,1-1.39-6,13.6,13.6,0,0,1,.43-4.58A10.33,10.33,0,0,1,12,15.88a10.87,10.87,0,0,1,4.9-2.78.3.3,0,0,0,.21-.17c.25-.45.48-.92.77-1.34a10.77,10.77,0,0,1,5.4-4,14,14,0,0,1,5.57-.77A5.64,5.64,0,0,1,31,7.32c.36.18.69.4,1.05.61l0,0a5.38,5.38,0,0,1,3-1.12,12.72,12.72,0,0,1,3,.12A12.37,12.37,0,0,1,42.62,8.4a10.09,10.09,0,0,1,4.32,4.54.3.3,0,0,0,.18.15,22.44,22.44,0,0,1,2.17.8,10.26,10.26,0,0,1,5.47,6.78,13.2,13.2,0,0,1,.38,3.6,15.32,15.32,0,0,1-.42,3.63,22.7,22.7,0,0,1-1.13,3.44.59.59,0,0,0,0,.6,9.43,9.43,0,0,1,1.55,3.81C55.23,36.05,55.26,36.35,55.3,36.65ZM40.16,51.87,40,51.75a6.3,6.3,0,0,1-2.42-3A8.41,8.41,0,0,1,37,45.4a2,2,0,0,1,4-.11c0,.42,0,.85.07,1.26a2.79,2.79,0,0,0,1.36,2.07,2.28,2.28,0,0,0,1.6.25,6.39,6.39,0,0,0,2.1-.68,2.58,2.58,0,0,0,1.41-2.38,7.73,7.73,0,0,0-.34-2.08,1.93,1.93,0,0,1,0-1,2,2,0,0,1,1.15-1.33,5.39,5.39,0,0,0,2.18-1.68,4.41,4.41,0,0,0,.81-3.24A5.32,5.32,0,0,0,51,35l-.14.11c-.4.33-.8.68-1.22,1a9.32,9.32,0,0,1-6.92,1.8,2.21,2.21,0,0,1-1.46-.67,1.84,1.84,0,0,1-.35-2A1.82,1.82,0,0,1,42.65,34a6.44,6.44,0,0,1,.86.09,5.23,5.23,0,0,0,2.72-.56,10.28,10.28,0,0,0,3.37-2.74,3.27,3.27,0,0,0,.5-.69,15.28,15.28,0,0,0,1.31-5.56,8.75,8.75,0,0,0-1.09-4.72,6.55,6.55,0,0,0-4.92-3.38A2,2,0,0,1,43.7,15a3.25,3.25,0,0,0-.23-.54,7,7,0,0,0-2.77-2.68,9.92,9.92,0,0,0-5.55-1.15.86.86,0,0,0-.8.59,4.88,4.88,0,0,0-.2.65,11.53,11.53,0,0,0-.21,2.49V51.17a5.62,5.62,0,0,0,0,.58,1.61,1.61,0,0,0,.73,1.32,1.69,1.69,0,0,0,.89.27c.54,0,1.08-.06,1.61-.09a4.65,4.65,0,0,0,2.28-.81A8.66,8.66,0,0,0,40.16,51.87Zm-26.73-23c.35-.16.68-.33,1-.47a10.22,10.22,0,0,1,3.22-.75,13.17,13.17,0,0,1,3.38.19c.63.12,1.25.33,1.88.45a2,2,0,0,1,1.57,2,1.94,1.94,0,0,1-2.13,1.83,8.56,8.56,0,0,1-.83-.23,10.88,10.88,0,0,0-4-.25,5.17,5.17,0,0,0-3.67,1.92,5.65,5.65,0,0,0-1.24,3.63A4.27,4.27,0,0,0,14,40.24a6.17,6.17,0,0,0,1.75,1.15,1.93,1.93,0,0,1,1.07,2.33,6.42,6.42,0,0,0-.34,2.3A2.54,2.54,0,0,0,17,47.46a3.43,3.43,0,0,0,1.68,1.08,8.26,8.26,0,0,0,2.61.39,2,2,0,0,1,1.08.3,2.25,2.25,0,0,1,.92,1.39,3.23,3.23,0,0,0,1.65,2.05,6,6,0,0,0,2.26.64,5.31,5.31,0,0,0,1.49,0A1.51,1.51,0,0,0,30,52a4.21,4.21,0,0,0,.06-.79q0-18.36,0-36.7c0-.68-.05-1.36-.1-2a4.13,4.13,0,0,0-.34-1.34.78.78,0,0,0-.65-.48,9.22,9.22,0,0,0-3.1.18,8.44,8.44,0,0,0-4.69,2.72A3.91,3.91,0,0,0,20.3,15a1.69,1.69,0,0,1-.79,1.06,2,2,0,0,1-.76.35c-.23,0-.46.09-.68.14a6.39,6.39,0,0,0-2.69,1.28,7.82,7.82,0,0,0-2.8,5.66,10.68,10.68,0,0,0,.1,2.46A14.58,14.58,0,0,0,13.43,28.82Z"></path>
                    <path className="cls-1" d="M46.77,28.09a8.52,8.52,0,0,1-6.43-2.61,9.19,9.19,0,0,1-2-3.28,14.79,14.79,0,0,1-.53-1.9A1.91,1.91,0,0,1,39.46,18a2,2,0,0,1,2.26,1.69,6.5,6.5,0,0,0,1.84,3.55,3.31,3.31,0,0,0,2.07.94,6.86,6.86,0,0,0,1.81-.09A1.94,1.94,0,1,1,47.79,28C47.42,28,47,28.07,46.77,28.09Z"></path>
                    <path className="cls-1" d="M18.37,35.87a2.68,2.68,0,0,1,1,.25A10,10,0,0,1,23,38.44a10.53,10.53,0,0,1,2.29,3.48,12.52,12.52,0,0,1,.86,3.47,1.94,1.94,0,0,1-3.81.68c-.07-.32-.05-.67-.09-1a6,6,0,0,0-2.88-4.7,7.77,7.77,0,0,0-1.55-.71,1.9,1.9,0,0,1-1.38-1.76A1.93,1.93,0,0,1,18.37,35.87Z"></path>
                    <path className="cls-1" d="M20.77,24.11a2.57,2.57,0,0,1-1.26-.19,1.94,1.94,0,0,1,.83-3.7,5.66,5.66,0,0,0,1.79-.2,3.08,3.08,0,0,0,2.1-2.34,2,2,0,0,1,2-1.59,2,2,0,0,1,1.82,2.48,7,7,0,0,1-5.29,5.26A8.63,8.63,0,0,1,20.77,24.11Z"></path>
                </g>
            </svg>
        )
    }
    if (iconName == "findMeIcon"){
        return (
            <svg data-name="Layer 1" fill={fillColor} xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 60 60">
                <defs></defs>
                <title>Connection</title>
                <path className="cls-1" d="M32,25.56a8.87,8.87,0,1,1,8.86-8.86A8.87,8.87,0,0,1,32,25.56ZM32,11.7a5,5,0,1,0,5,5A5,5,0,0,0,32,11.7Z"></path>
                <path className="cls-1" d="M14.28,54.07a8.86,8.86,0,1,1,8.86-8.86A8.86,8.86,0,0,1,14.28,54.07Zm0-13.85a5,5,0,1,0,5,5A5,5,0,0,0,14.28,40.22Z"></path>
                <path className="cls-1" d="M49.72,54.07a8.86,8.86,0,1,1,8.86-8.86A8.87,8.87,0,0,1,49.72,54.07Zm0-13.85a5,5,0,1,0,5,5A5,5,0,0,0,49.72,40.22Z"></path>
                <rect className="cls-1" x="39.83" y="20.42" width="4" height="19.68" transform="translate(-9.47 24.46) rotate(-29.43)"></rect>
                <rect className="cls-1" x="13.3" y="28.26" width="19.68" height="4" transform="translate(-14.59 35.55) rotate(-60.57)"></rect>
                <rect className="cls-1" x="21.5" y="43.21" width="21" height="4"></rect>
            </svg>
        )
    }
    if (iconName == "mecardsIcon"){
        return (
            <svg data-name="Layer 1" fill={fillColor} xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 60 60">
                <defs></defs>
                <title>Work</title>
                <g id="iQFwDU.tif">
                    <path className="cls-1" d="M54.09,53.15H44.18s-.07-.06-.12-.07a2.53,2.53,0,0,1-2-2.68V45.11H11.64A3.47,3.47,0,0,1,7.91,42a.9.9,0,0,0-.08-.21V39.74a1.3,1.3,0,0,1,1.37-.68c.87,0,1.75,0,2.67,0V15a6.27,6.27,0,0,1,0-.75,3.58,3.58,0,0,1,2.18-3.12c.21-.09.43-.16.64-.24H48.24a2.67,2.67,0,0,0,.26.09,4.31,4.31,0,0,1,3.63,4.52V27h.53a10.63,10.63,0,0,1,1.13,0,2.63,2.63,0,0,1,2.38,2.08v22A3,3,0,0,1,54.09,53.15ZM17.94,35H42.09v-.53c0-1.62,0-3.24,0-4.86A2.52,2.52,0,0,1,44.7,27h1.35V16.92H17.94ZM50.1,27c0-.11,0-.17,0-.23,0-3.93,0-7.87,0-11.8a1.9,1.9,0,0,0-.46-1.09,2.87,2.87,0,0,0-2.35-1H15.44A1.43,1.43,0,0,0,14,14.07a3.71,3.71,0,0,0-.1.94q0,11.75,0,23.5c0,.17,0,.33,0,.5H42.05V37H17.25c-1.06,0-1.38-.31-1.38-1.37V16.25c0-1,.32-1.36,1.35-1.36H47.15a.93.93,0,0,1,.93.78,3.56,3.56,0,0,1,.05.65V27Zm4,6.08h-10v14h10ZM42.06,41.1H9.85c.12,1.58.53,2,2,2H42.06Zm12.11,8H44.12a.53.53,0,0,0,0,.13v1c0,.71.16.88.89.88h8.44c.42,0,.72-.17.74-.62S54.17,49.63,54.17,49.15Zm0-18.19a1.19,1.19,0,0,0,0-.2c0-.31,0-.63,0-.94,0-.66-.18-.84-.83-.84H44.76c-.37,0-.63.15-.66.52s0,1,0,1.46Z"></path>
                    <path className="cls-1" d="M54.17,53.63H44l-.12-.08a3,3,0,0,1-2.31-3.15V45.59h-30a3.94,3.94,0,0,1-4.18-3.47l-.1-.3v-2.2l.06-.11a1.79,1.79,0,0,1,1.81-.93c.6,0,1.2,0,1.82,0h.35V14.84a4.11,4.11,0,0,1,0-.7,4,4,0,0,1,2.46-3.49l.46-.17.37-.11H48.33l.18.07.09,0a4.8,4.8,0,0,1,4,5v11H53a7.85,7.85,0,0,1,.84,0,3.12,3.12,0,0,1,2.79,2.42l0,.14,0,22.15a3.48,3.48,0,0,1-2.39,2.39Zm-9.85-1H54A2.5,2.5,0,0,0,55.69,51V29.15a2.15,2.15,0,0,0-1.94-1.69c-.24,0-.48,0-.73,0H51.65v-12a3.82,3.82,0,0,0-3.26-4.05l-.24-.08H14.81l-.13,0-.42.16a3.1,3.1,0,0,0-1.89,2.74,5.43,5.43,0,0,0,0,.57v24.7h-1.3c-.64,0-1.26,0-1.88,0a.84.84,0,0,0-.86.35v1.83a1,1,0,0,1,.07.23,3,3,0,0,0,3.26,2.69H42.56V50.4a2.05,2.05,0,0,0,1.64,2.22Zm7.55-1H45c-1,0-1.37-.38-1.37-1.36l0-1.18.1-.36.38-.06H54.65v.91c0,.33,0,.66,0,1a1.11,1.11,0,0,1-1.22,1.07Zm-.52-1h2.07c.26,0,.26-.06.26-.16a8.58,8.58,0,0,0,0-.88H44.56v.64a1.17,1.17,0,0,0,0,.38s.07,0,.38,0Zm3.28-3.11h-11v-15h11Zm-10-1h9.07V33.52H44.6Zm-2.06-3.06H11.89c-1.77,0-2.38-.58-2.52-2.4l0-.51H42.54Zm-32.16-2c.13.87.42,1,1.51,1H41.58v-1Zm32.15-2.09H13.44l0-.61c0-.12,0-.24,0-.37q0-11.74,0-23.5a4.9,4.9,0,0,1,.11-1,1.91,1.91,0,0,1,1.9-1.58H47.3A3.35,3.35,0,0,1,50,13.53a2.46,2.46,0,0,1,.57,1.39c0,3.15,0,6.29,0,9.43v2.38a1.37,1.37,0,0,1,0,.19l-.05.43-.44.09H47.65V16.33a2.5,2.5,0,0,0,0-.55.46.46,0,0,0-.48-.4H17.22c-.77,0-.87.1-.87.88v19.4c0,.79.1.89.9.89H42.53Zm-28.18-1H41.58v-1H17.25c-1.32,0-1.86-.54-1.86-1.85V16.25c0-1.3.53-1.83,1.83-1.83h30a1.4,1.4,0,0,1,1.37,1.16,3.33,3.33,0,0,1,.07.75V26.48h1V24.35c0-3.14,0-6.28,0-9.42a1.4,1.4,0,0,0-.35-.79,2.39,2.39,0,0,0-2-.82H15.47a1,1,0,0,0-1,.85,3.58,3.58,0,0,0-.09.83V38.53Zm28.21-3.06H17.46v-19H46.53v11H44.7a2.05,2.05,0,0,0-2.13,2.14v5.87Zm-24.15-.95h23.2V29.6a3,3,0,0,1,3.09-3.1h.88V17.4H18.41Zm35.73-3.08H43.61v-.92c0-.36,0-.71,0-1.05a1,1,0,0,1,1.13-1h8.59c.91,0,1.3.39,1.31,1.32v.95c0,.05,0,.1,0,.19l-.07.4Zm-9.58-1h9.13q0-.33,0-.66c0-.26,0-.33,0-.34s-.07,0-.31,0H44.75a.68.68,0,0,0-.17,0C44.55,29.85,44.56,30.16,44.56,30.48Z"></path>
                </g>
            </svg>
        )
    }
}

export function GetSelectedLevelOptionAmount(value){
    if (value == "Regular Chicken Shawarma"){
        return "12"
    }

    if (value == "Regular Beef Shawarma"){
        return "14"
    }

    if (value == "Regular Combo (Chicken and Beef)"){
        return "880"
    }

    if (value == "Owanbe Package"){
        return "15"
    }

    if (value == "Regular Mega (Chicken, Beef, and Shrimp)"){
        return "16"
    }

    if (value == "Double Sausage Chicken Shawarma"){
        return "14"
    }
}

export function GetSelectedStatusLevelLabel(value) {
    value = parseInt(value)

    if(value <= 20){
      return "received.."
    }

    if(value >= 20 && value < 40){
      return "preparing.."
    }

    if(value >= 40 && value < 60){
      return "cooking..."
    }

    if(value >= 60 && value < 80){
      return "almost ready.."
    }

    if(value >= 80 && value < 100){
      return "finishing touches"
    }

    if(value == 100){
        return "food ready!"
    }

    return "i need igbo and shayo o!"
}

export function HmsToSecondsOnly(totalSecs) {
    var str = totalSecs.substr(0,5)
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s *1000 + ((parseInt(totalSecs.substr(6, 9), 10))/100);
}


export function ConvertSecondsToDate(secondString) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var date;
    try {
      date = new Date(parseInt(secondString) * 1000);
    } catch (error) {
      date = new Date(1996, 2, 13);
    }
    var month = months[date.getMonth()];
    var day = date.getDate();
    var year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

export function MoveSunInSky() {
    // Get the cloud container element
    const cloudContainer = document.querySelector('.cloud-container');
  
    // Set initial position and speed of the radial gradient
    let positionX = 0;
    let positionY = 0;
    const speed = 1; // Adjust this value to change the speed of the movement
  
    // Define an array of movement directions
    const directions = ['diagonal', 'horizontal', 'vertical', 'zigzag'];
    let currentDirectionIndex = 0;
    let isReversing = false;
  
    // Function to update the background attribute
    function updateBackground() {
      // Calculate the new position based on the current direction and reversing flag
      if (!isReversing) {
        switch (directions[currentDirectionIndex]) {
          case 'diagonal':
            positionX += speed;
            positionY += speed;
            break;
          case 'horizontal':
            positionX += speed;
            break;
          case 'vertical':
            positionY += speed;
            break;
          case 'zigzag':
            positionX += speed;
            positionY += Math.sin(positionX / 20) * 2; // Adjust the multiplier to change the zigzag intensity
            break;
          default:
            break;
        }
      } else {
        positionX -= speed;
        positionY -= speed;
      }
  
      // Check if the current direction has completed a cycle
      if (positionX >= 100 || positionY >= 100 || positionX <= 0 || positionY <= 0) {
        if (!isReversing) {
          isReversing = true;
        } else {
          // Move to the next direction in the array
          currentDirectionIndex = (currentDirectionIndex + 1) % directions.length;
          isReversing = false;
        }
      }
  
      // Create the new background attribute value
      const newBackground = `radial-gradient(circle at ${positionX}% ${positionY}%, white, #BDE4F8)`;
  
      // Update the background attribute
      cloudContainer.style.background = newBackground;
    }
  
    // Call the updateBackground function every 50 milliseconds (adjust the interval as needed)
    setInterval(updateBackground, 500);
  
    return;
  }


  export function StripCodeFences(code) {
  if (!code || typeof code !== 'string') return '';
  let cleaned = code.replace(/^\uFEFF/, '') // Remove BOM
                    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII
                    .replace(/\r\n|\r/g, '\n') // Normalize line endings
                    .replace(/^\s*```(?:\w+)?\s*?\n?([\s\S]*?)\n?\s*```?\s*$/, '$1') // Remove code fences
                    .replace(/^\s*```.*$/gm, '') // Remove stray ``` lines
                    .replace(/^\s*export\s+(default\s+)?[\s\S]*?$/gm, '') // Remove export statements
                    .trim();
  return cleaned;
}

export function cleanTimeTravelCode(code) {
  if (!code || typeof code !== 'string') return '';

  let cleaned = code
    // Remove BOM
    .replace(/^\uFEFF/, '')
    // Remove non-ASCII characters
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    // Normalize line endings to \n
    .replace(/\r\n|\r/g, '\n')
    // Remove Markdown code fences
    .replace(/^\s*```(?:\w+)?\s*?\n?([\s\S]*?)\n?\s*```?\s*$/, '$1')
    .replace(/^\s*```.*$/gm, '')
    // Remove export statements (export default, export const, etc.)
    .replace(/^\s*export\s+(default\s+|const\s+|let\s+|var\s+|function\s+)?[\s\S]*?$/gm, '')
    // Remove import statements
    .replace(/^\s*import\s+[\s\S]*?$/gm, '')
    // Remove module or other invalid keywords
    .replace(/\bmodule\b/g, '')
    // Remove stray semicolons or invalid tokens
    .replace(/;+/g, ';')
    // Remove leading/trailing whitespace
    .trim();

  // Ensure ThrydObjects definition remains
  if (!cleaned.includes('ThrydObjects')) {
    console.warn('cleanTimeTravelCode: ThrydObjects not found in cleaned code');
  }

  return cleaned;
}