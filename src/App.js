import React from 'react';
import './App.css';
import { processDoc } from './processDoc';

//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

function App() {
  const [pasted, setPasted] = React.useState('')

  // taken from https://stackoverflow.com/a/59462028
  const handleClick = () => {
    const element = document.getElementById('formatted-output')
    if (!element.innerText) {
      console.log("nothing to copy, returning")
      return
    }
    window.getSelection().removeAllRanges();
    let range = document.createRange();
    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    alert('copied output to the clipboard')
  }

  const handlePaste = (event) => {
    let content = event.clipboardData.getData('text/html')
    var doc = new DOMParser().parseFromString(content, 'text/html');
    doc = processDoc(doc) //comment this line out if you want to debug / inspect original HTML
    content = new XMLSerializer().serializeToString(doc)
    setPasted(content)
  }

  return (
    <div className="App container">
      <h2>Paste Slack Thread:</h2>
      <textarea placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></textarea>
      <p>
        <button onClick={handleClick}>Copy Formatted Output</button>
      </p>
      <div className="output" id="formatted-output" dangerouslySetInnerHTML={{__html: pasted}}></div>
    </div>
  );
}

export default App;