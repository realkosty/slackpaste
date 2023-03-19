import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [pasted, setPasted] = React.useState('')

  const handlePaste = (event) => {
    let content = event.clipboardData.getData('text/html')
    // console.log(content)
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const tagsToRemove = 'input, img, div';
    let count = 0
    // let messages = [];

    /// REPLACES EMOJIs with text about what the emoji is
    //     i.e. the potato emoji becomes ":potato:"
    doc.querySelectorAll('[data-stringify-emoji]').forEach(e => {
      // console.log(e)
      var emojiText = document.createElement("span");
      emojiText.innerHTML = e.getAttribute('data-stringify-emoji') + " "
      e.parentNode.replaceChild(emojiText, e)
    });

    /// REMOVES AVATARS
    doc.querySelectorAll('.c-avatar').forEach(e => {
      e.remove();
    });

    /// REPLACES IMGs with their alt text 
    //   (since we've gotten rid of emojis and avatars,
    ///   this should just be uploaded images)
    //   TODO: automatically download the image so it can be easily uploaded to notion
    doc.querySelectorAll('.c-files_container').forEach(e => {
      const img = e.querySelector('img')
      var imgText = document.createElement("span");
      imgText.innerHTML = e.getAttribute('alt')
      e.parentNode.replaceChild(imgText, e)
    });

    /// REMOVES STYLING FROM DIVS
    doc.querySelectorAll('div').forEach(e => {
      e.className = ''
      e.style = {}
    });

    for(const elm of doc.querySelectorAll(".c-virtual_list__item")) {
      // for a single message:
      //    get sender: class c-message__sender
      //    get timestamp: c-timestamp__label -- sometimes this is 1 day ago, so better to grab this element's parent link and select the aria-label of that link
      //    get content: c-message_kit__blocks
      //    get avatar: c-base_icon

      // emoji class: c-emoji

      count += 1
      console.log(count)
      console.log(elm.innerHTML);
      console.log("~~~~~~~~~~~~~~~~~~")
      const sender = elm.querySelector(".c-message__sender")?.innerText
      console.log(`sender: ${sender}`);
      console.log("~~~~~~~~~~~~~~~~~~")
      const timeSent = elm.querySelector(".c-timestamp__label")?.innerText
      console.log(`timeSent: ${timeSent}`);
      console.log("~~~~~~~~~~~~~~~~~~")
      const msgContent = elm.querySelector(".c-message_kit__blocks")?.innerHTML
      console.log(`msgContent: ${msgContent}`);
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    }

    doc.querySelectorAll('*').forEach(e => {
      if (e.hasAttribute('className')){
        e.className = "";
      }
    });
    content = new XMLSerializer().serializeToString(doc)
    setPasted(content)
  }

  return (
    <div className="App">
      <input onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></input>
      <div dangerouslySetInnerHTML={{__html: pasted}}></div>
    </div>
  );
}

export default App;