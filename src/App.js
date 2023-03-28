import React from 'react';
import './App.css';

var emoji = require('node-emoji')

//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

// also, make the paste box much bigger so you can see all/most of the input from the slack thread

// also, make the pasted-in container nice and clean -- less barebones looking
//   and maybe in a nice font or something ??

function App() {
  const [pasted, setPasted] = React.useState('')

  const handlePaste = (event) => {
    let content = event.clipboardData.getData('text/html')
    const doc = new DOMParser().parseFromString(content, 'text/html');

    /// REPLACES EMOJIs with text about what the emoji is
    //     i.e. the potato emoji becomes ":potato:"
    //
    // Custom emoji beyond the basics can be added per the docs: https://www.npmjs.com/package/node-emoji
    doc.querySelectorAll('[data-stringify-emoji]').forEach(e => {
      var emojiText = document.createElement("span");
      var shortcode = e.getAttribute('data-stringify-emoji') + " ";
      emojiText.innerHTML = emoji.emojify(`${shortcode}`) + " ";
      e.parentNode.replaceChild(emojiText, e)
    });

    /// REMOVES AVATARS
    doc.querySelectorAll('.c-avatar').forEach(e => {
      e.remove();
    });

    /// REMOVES 'new messages' divider
    doc.querySelectorAll('.c-message_list__unread_divider').forEach(e => {
      e.remove();
    });

     /// REMOVES ATTACHMENTS
    doc.querySelectorAll('.c-message_kit__attachments').forEach(e => {
      e.remove();
    });

    /// REMOVES SVGS
    doc.querySelectorAll('svg').forEach(e => {
      e.remove();
    });

    /// REPLACES IMGs with their alt text 
    //   (since we've gotten rid of emojis and avatars,
    ///   this should just be uploaded images)
    //   TODO: instead of deleting, ideally we'd either allow image to show up by fixing CORS blockage, 
    //     or else automatically download the image so it can be easily uploaded to notion
    doc.querySelectorAll('.c-files_container').forEach(e => {
      const img = e.querySelector('img')
      if (img) {
        console.log(img)
        var imgText = document.createElement("span");
        imgText.className = 'missing-img'
        var warning = ''
        for(let i = 0; i < 10; i++) {
          warning += emoji.emojify(`:warning:`)
        }
        imgText.innerHTML = `${warning} <<< ${img.getAttribute('alt')} >>> (you will need to download this file manually from the thread and manually add it here) ${warning}`
        e.parentNode.replaceChild(imgText, e)
      }
    });

    var foundFirstTimestamp = false;
    for(const elm of doc.querySelectorAll(".c-virtual_list__item")) {
      // Timestamp manipulation is done to avoid getting timestamps reading
      //   "1 day ago" -- someone looking later at a slack dump will have no idea when
      //   "1 day ago" actually was.
      const timestampLink = elm.querySelector(".c-timestamp__label")
      if (timestampLink) {
        const timestamp = timestampLink?.parentElement.getAttribute('data-ts')
        const humanReadableTimestamp = new Date(timestamp * 1000).toDateString() // i.e. Mon Mar 23 2023
        timestampLink.remove();

        // Apply timestamp only to the first message in the thread
        if (!foundFirstTimestamp) {
          elm.querySelector('.c-message__sender button').innerHTML += ` (${humanReadableTimestamp})`;
          foundFirstTimestamp = true;
        }
      }

      // // TODO: possibly use these to construct <Message /> components in react, passing in the
      // // relevant props
      // console.log(elm.innerHTML);
      // console.log("~~~~~~~~~~~~~~~~~~")
      // const sender = elm.querySelector(".c-message__sender")?.innerText
      // console.log(`sender: ${sender}`);
      // console.log("~~~~~~~~~~~~~~~~~~")

      // console.log("~~~~~~~~~~~~~~~~~~")
      // const msgContent = elm.querySelector(".c-message_kit__blocks")?.innerHTML
      // console.log(`msgContent: ${msgContent}`);
      // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    }

    /// REMOVES STYLING FROM DIVS
    doc.querySelectorAll('div').forEach(e => {
      e.className = ''
      e.style = {}
      e.style.textAlign = 'left'
    });

    /// REMOVES leftover classes from everything
    doc.querySelectorAll('*').forEach(e => {
      if (e.hasAttribute('className')){
        e.className = "";
      }
    });

    content = new XMLSerializer().serializeToString(doc)
    setPasted(content)
  }

  return (
    <div className="App container">
      <h2>Paste Slack Thread:</h2>
      <textarea placeholder="paste slack thread here" rows="5" cols="80" onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></textarea>
      <div className="output" dangerouslySetInnerHTML={{__html: pasted}}></div>
    </div>
  );
}

export default App;