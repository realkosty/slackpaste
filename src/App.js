import React from 'react';
import './App.css';
import { processDoc } from './processDoc';
import { copyToClipboard } from './copyToClipboard';
import { PopupProvider } from './popupContext';
import Popup from './popup'
import DeleteButton from './DeleteButton';
import { usePopup } from './popupContext'

var emoji = require('node-emoji')
const SLACK_INPUT = 'slack-input'


//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

function CopyButton({pasted, disabled}) {
  const { triggerPopup } = usePopup()

  const handleCopy = () => {
    if (copyToClipboard()) {
      triggerPopup(`${emoji.emojify(':white_check_mark:')}  Copied to clipboard!`)
    }
  }

  return (
    <p><button className="copy-button" onClick={handleCopy} disabled={disabled}>Copy Formatted Output</button></p>
  )
}

function App() {
  const [pasted, setPasted] = React.useState('')
  const [disabled, setDisabled] = React.useState(true)

  const handlePaste = (event) => {
    let content = event.clipboardData.getData('text/html')
    var doc = new DOMParser().parseFromString(content, 'text/html');
    var [processed, attachmentsDetected] = processDoc(doc) //comment this line out if you want to debug / inspect original HTML
    content = new XMLSerializer().serializeToString(processed)
    setDisabled(false)
    setPasted(content)
    if(attachmentsDetected > 0) {
      const attachmentGrammar = attachmentsDetected > 1 ? 'attachments' : 'attachment'
      alert(`${attachmentsDetected} ${attachmentGrammar} detected. Remember to download image files and manually include them in notion.`)
    }
  }

  return (
    <PopupProvider>
      <div className="App container">
        <div className="col1">
          <h2 className="header">Paste Slack Thread:</h2>
          <textarea placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id={SLACK_INPUT} autoComplete="no"></textarea>
          <DeleteButton idToClear={SLACK_INPUT} />
          <CopyButton pasted={pasted} disabled={disabled} />
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