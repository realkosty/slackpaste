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

function Checkbox({label, initialValue, onChangeCallback}) {
  return (
    <div class="option">
      <label>
        <input type="checkbox" checked={initialValue} onChange={(e) => {onChangeCallback(e.target.checked);}}/>
        {label}
      </label>
    </div>
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
  const [includeChannelId, setIncludeChannelId] = React.useState(getFromLocalStorage('includeChannelId', true))
  const [csvExportFriendly, setCsvExportFriendly] = React.useState(getFromLocalStorage('csvExportFriendly', false))

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
      let [processed, attachmentsDetected] = processDoc(originalDoc, {anonymize, includeChannelId, csvExportFriendly})
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
  }, [originalDoc, anonymize, includeChannelId, csvExportFriendly])

  React.useEffect(() => {
    localStorage.setItem('anonymize', JSON.stringify(anonymize));
    localStorage.setItem('includeChannelId', JSON.stringify(includeChannelId));
    localStorage.setItem('csvExportFriendly', JSON.stringify(csvExportFriendly));
  }, [anonymize, includeChannelId, csvExportFriendly])
  

  return (
    <PopupProvider>
      <div className="App container">
        <div className="col1">
          <h2 className="header">Paste Slack Thread:</h2>
          <Checkbox label="Anonymize" initialValue={anonymize} onChangeCallback={setAnonymize} />
          <Checkbox label="Include channel ID" initialValue={includeChannelId} onChangeCallback={setIncludeChannelId} />
          <Checkbox label="CSV export-friendly (link text, code blocks)" initialValue={csvExportFriendly} onChangeCallback={setCsvExportFriendly} />
          <textarea autoFocus placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id={SLACK_INPUT} autoComplete="no"></textarea>
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