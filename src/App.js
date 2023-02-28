import logo from './logo.svg';
import './App.css';

var PASTED = '';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <input onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></input>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

const handlePaste = (event) => {
  const content = event.clipboardData.getData('text/html')
  const strippedContent = content.replace(/(<\/?(?:a|img)[^>]*>)|<[^>]+>/ig, '$1'); // keeps a, img tags

  // replace multiple spaces (3?) with newline - \n
  // 

  PASTED = strippedContent;
  console.log(strippedContent);
  
  /*
    <a target="_blank" class="c-link" data-stringify-link="https://testorg-az.sentry.io/settings/integrations/github/" delay="150" data-sk="tooltip_parent" href="https://testorg-az.sentry.io/settings/integrations/github/" rel="noopener noreferrer" style="box-sizing: inherit; color: rgba(var(--sk_highlight,18,100,163),1); text-decoration: none;">personal repos in testorg-az GitHub integration config</a>
  */
}

export default App;