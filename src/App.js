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

function getFromLocalStorage(key, defaultValue) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

function App() {
  // todo: use one state https://stackoverflow.com/a/61106532
  // to enable us to setDisabled(true) upon clicking the 'clear' button
  // Right now we only setPasted to empty and that leaves the 'copy' button
  // enabled when there is nothing to copy.
  const [pasted, setPasted] = React.useState('')
  const [disabled, setDisabled] = React.useState(true)
  const [originalDoc, setOriginalDoc] = React.useState(null)
  const [anonymize, setAnonymize] = React.useState(getFromLocalStorage('anonymize', false))
  const [removeSeparator, setRemoveSeparator] = React.useState(getFromLocalStorage('removeSeparator', false))
  const [includeTimestamp, setIncludeTimestamp] = React.useState(getFromLocalStorage('includeTimestamp', true))

  React.useEffect(() => {
    document.getElementById(SLACK_INPUT).focus()
  }, [pasted])

  const handlePaste = (event) => {
    let content = event.clipboardData.getData('text/html');
    let newDoc = new DOMParser().parseFromString(content, 'text/html');
    setOriginalDoc(newDoc);
  }
  
  React.useEffect(() => {
    if (originalDoc) {
      let [processed, attachmentsDetected] = processDoc(originalDoc, anonymize, removeSeparator, includeTimestamp)
      let content = new XMLSerializer().serializeToString(processed)
      setDisabled(false)
      setPasted(content)
      if(attachmentsDetected > 0) {
        const attachmentGrammar = attachmentsDetected > 1 ? 'attachments' : 'attachment'
        alert(`${attachmentsDetected} ${attachmentGrammar} detected. Remember to download image files and manually include them in notion.`)
      }
    } else {
      setDisabled(true);
      setPasted('');
    }
  }, [originalDoc, anonymize, removeSeparator, includeTimestamp])

  React.useEffect(() => {
    localStorage.setItem('anonymize', JSON.stringify(anonymize));
    localStorage.setItem('removeSeparator', JSON.stringify(removeSeparator));
    localStorage.setItem('includeTimestamp', JSON.stringify(includeTimestamp));
  }, [anonymize, removeSeparator, includeTimestamp])
  

  return (
    <PopupProvider>
      <div className="App container">
        <div className="col1">
          <h2 className="header">Paste Slack Thread:</h2>
          <textarea autoFocus placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id={SLACK_INPUT} autoComplete="no"></textarea>
          <div class="option">
            <label>
              <input type="checkbox" checked={anonymize} onChange={(e) => {setAnonymize(e.target.checked);}}/>
              Anonymize
            </label>
          </div>
          <div class="option">
            <label>
              <input type="checkbox" checked={removeSeparator} onChange={(e) => {setRemoveSeparator(e.target.checked);}}/>
              Remove separator 
            </label>
          </div>
          <div class="option">
            <label>
              <input type="checkbox" checked={includeTimestamp} onChange={(e) => {setIncludeTimestamp(e.target.checked);}}/>
              Include timestamp 
            </label>
          </div>
          <DeleteButton onClick={() => {document.getElementById(SLACK_INPUT).value = '';  setOriginalDoc(null);}} />
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