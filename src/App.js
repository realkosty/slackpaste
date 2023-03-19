import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [pasted, setPasted] = React.useState('')

  const handlePaste = (event) => {
    const content = event.clipboardData.getData('text/html')
    console.log(content)
    setPasted(content)
  
    // manipulate the pasted content to get rid of the junk and keep the desired stuff
  
    // doubt this regex is the right way to go but it's a path to keep as backup
    // const strippedContent = content.replace(/(<\/?(?:a|img)[^>]*>)|<[^>]+>/ig, '$1'); // keeps a, img tags
    /*
      <a target="_blank" class="c-link" data-stringify-link="https://testorg-az.sentry.io/settings/integrations/github/" delay="150" data-sk="tooltip_parent" href="https://testorg-az.sentry.io/settings/integrations/github/" rel="noopener noreferrer" style="box-sizing: inherit; color: rgba(var(--sk_highlight,18,100,163),1); text-decoration: none;">personal repos in testorg-az GitHub integration config</a>
    */
  }

  return (
    <div className="App">
      <header className="App-header">
        <input onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></input>

        <div className="smalltxt">{pasted}</div>
      </header>
    </div>
  );
}

export default App;