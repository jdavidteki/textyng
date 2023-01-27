import React, { useState } from 'react';

import './HomePage.css';

const HomePage = (props) => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [leftCounter, setleftCounter] = useState(0);
  const [rightCounter, setrightCounter] = useState(0);
  const leftMessage = 'ryting';
  const rightMessage = 'ryeading?';

  const typeWriter = () => {
    if (leftCounter < leftMessage.length) {
      setLeftText(leftText + leftMessage.charAt(leftCounter));
      setleftCounter(leftCounter + 1);
    }

    if (rightCounter < rightMessage.length) {
      setRightText(rightText + rightMessage.charAt(rightCounter));
      setrightCounter(rightCounter + 1);
    }
  };

  setTimeout(typeWriter, 150);

  return (
    <div className="HomePage">
      <div className="HomePage__left-side">
        <div className="HomePage__left-side-a" onClick={() => props.changePage("newscript")}>
          <h1 className="HomePage__text HomePage__text--glossy">{leftText}</h1>
        </div>
      </div>
      <div className="HomePage__demarcation">
        <div className="HomePage-or">or</div>
      </div>
      <div className="HomePage__right-side">
        <div className="HomePage__right-side-a" onClick={() => props.changePage("readerview")}>
          <h1 className="HomePage__text HomePage__text--glossy">{rightText}</h1>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
