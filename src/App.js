import React from 'react';
import './App.css';
import { processDoc } from './processDoc';
import { copyToClipboard } from './copyToClipboard';
import { PopupProvider } from './popupContext';
import Popup from './popup'
import { usePopup } from './popupContext'

var emoji = require('node-emoji')


//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

function CopyButton({pasted}) {
  const { triggerPopup } = usePopup()

  const handleCopy = () => {
    if (copyToClipboard()) {
      triggerPopup(`${emoji.emojify(':scissors:')}  Copied to clipboard!  ${emoji.emojify(':scissors:')}`)
    }
  }

  return (
    <p><button className="copy-button" onClick={handleCopy}>Copy Formatted Output</button></p>
  )
}

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
    <PopupProvider>
      <div className="App container">
        <div className="col1">
          <h2 className="header">Paste Slack Thread:</h2>
          <textarea placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></textarea>          
          <CopyButton pasted={pasted} />
          <Popup />
        </div>
        <div className="col2">
          <div className="output">
            <div id="formatted-output" dangerouslySetInnerHTML={{__html: pasted}}></div>
          </div>
        </div>
      </div>
    </PopupProvider>
  );
}

export default App;