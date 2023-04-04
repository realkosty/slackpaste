import React from 'react';
import './App.css';
import { processDoc } from './processDoc';
import { copyToClipboard } from './copyToClipboard';

//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

function App() {
  const [pasted, setPasted] = React.useState('')

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
        <button onClick={copyToClipboard}>Copy Formatted Output</button>
      </p>
      <div className="output" id="formatted-output" dangerouslySetInnerHTML={{__html: pasted}}></div>
    </div>
  );
}

export default App;