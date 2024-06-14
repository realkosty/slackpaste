var emoji = require('node-emoji')

const AVATAR_CLASS = '.c-avatar'
const NEW_MESSAGES_DIVIDER_CLASS = '.c-message_list__unread_divider'
const ATTACHMENTS_CLASS = '.c-message_kit__attachments' // how is this different from attached files?
const CUSTOM_STATUS_EMOJI_CLASS = '.c-custom_status'
const ATTACHED_FILES_CONTAINER_CLASS = '.p-message_gallery_image_file'
const MESSAGE_CLASS = '.c-virtual_list__item' // or '.c-message_kit__message'?
const TIMESTAMP_LABEL_CLASS = '.c-timestamp__label'
const TOP_THREE_EMOJIS_CLASS = '.c-message__actions'
const ADD_REACTION_CLASS = '.c-reaction_add'
const SENDER_SELECTOR = '.c-message__sender .c-message__sender_button'
const DUPLICATE_SENDER_SELECTOR = '.c-message__sender .offscreen'
const SLACK_CONNECT_EXT_ICON_SELECTOR = '.c-team_icon'
const MENTION_SELECTOR = '.c-member_slug'
const SEPARATOR_SELECTOR = '[data-item-key="separator"]'
const EDITED_SELECTOR = '.c-message__edited_label'
const MESSAGE_SECTION_SELECTOR = '.p-rich_text_section'
const MESSAGE_QUOTE_SELECTOR = '.c-mrkdwn__quote'
const MESSAGE_BODY_SELECTOR = '.p-rich_text_block'
//const MESSAGE_SECTION_LIST_SELECTOR = '.p-rich_text_section, .p-rich_text_list'

const SVG_ELEMENT = 'svg'
const IMG_ELEMENT = 'img'
const DIV_ELEMENT = 'div'
const PARAGRAPH_ELEMENT = 'p'
const BR_ELEMENT = 'br'
const LI_ELEMENT = 'li'

// By default, slack provides an image src that is the thumbnail
// version, aka lower resolution. This replaces that with the
// fullsize image. 
const increaseResolution = (image) => {
  var formatted = image.replace('files-tmb', 'files-pri') // thumbnail vs fullsize i think
  formatted = formatted.replace('_720.png', '.png')
  return formatted
}

function replaceAll(doc, searchText, replacementText) {
    function replaceText(node) { // recursive 
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = node.nodeValue.replace(new RegExp(searchText, 'g'), replacementText);
        } else {
            for (let child of node.childNodes) {
                replaceText(child);
            }
        }
    }
    replaceText(doc);
}

function doesAPrecedeB(a, b) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
}

// Returns an array of all sibling DOM nodes between and a and b
// a itself is included in the result, b is not
function getNodeSiblingsBetweenIncludingA(a, b) {
  if (!a || !b) {
    throw new Error('Invalid arguments');
  }
  if (a === b) {
    return [];
  }
  if (!doesAPrecedeB(a, b)) {
    throw new Error('First element does not precede second element');
  }
  if (a.parentNode !== b.parentNode) {
    throw new Error('Elements have different parents');
  }
  let siblings = [a];
  let current = a.nextSibling;
  while (current && current !== b) {
      siblings.push(current);
      current = current.nextSibling;
  }
  return siblings;
};

function removeDataAttributes(element) {
  const attributes = element.attributes;
  for (let i = attributes.length - 1; i >= 0; i--) {
      const attribute = attributes[i];
      if (attribute.name.startsWith('data-')) {
          element.removeAttribute(attribute.name);
      }
  }
}

function prettyPrintHTML(html) {
  const tab = '  ';
  let result = '';
  let indent = '';
  html.split(/>\s*</).forEach(element => {
      if (element.match(/^\/\w/)) {
          indent = indent.substring(tab.length);
      }
      result += indent + '<' + element + '>\n';
      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input")) {
          indent += tab;
      }
  });
  return result.substring(1, result.length - 2);
}

function changeAToSpan(anchor) {
  if (!anchor || anchor.tagName !== 'A') {
    throw new Error('Invalid argument');
  }
  const span = document.createElement('span');
  Array.from(anchor.attributes).forEach(attr => {
    if (attr.name !== 'href') {
      span.setAttribute(attr.name, attr.value);
    }
  });
  span.innerHTML = anchor.innerHTML;
  anchor.parentNode.replaceChild(span, anchor);
}

function surroundElement(targetElement, htmlTemplate) {
  if (!targetElement) {
      return;
  }
  const targetElementHTML = targetElement.outerHTML;
  const newHTML = htmlTemplate.replace('{targetElement}', targetElementHTML);
  const range = document.createRange();
  const documentFragment = range.createContextualFragment(newHTML);
  targetElement.parentNode.replaceChild(documentFragment, targetElement);
}

const processDoc = (inputDoc, {anonymize, includeChannelId, csvExportFriendly}) => {
    let doc = inputDoc.cloneNode(true); // deep copy

    var attachmentsDetected = 0;

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

    // remove links from all mentions
    doc.querySelectorAll(MENTION_SELECTOR).forEach(e => {
      changeAToSpan(e);
    });

    // Replace linebreaks marked by class
    doc.querySelectorAll('.c-mrkdwn__br').forEach(e => {
      const paragraph = document.createElement(BR_ELEMENT) // so that it can be later transformed to <p>
      e.parentNode.replaceChild(paragraph, e)
    });
   
    // Don't ask why but without this, inline code/links insided blockquotes won't be formatted correctly
    // Side effect of this is that there will be "Empty quote" placeholder in notion.
    doc.querySelectorAll(MESSAGE_QUOTE_SELECTOR).forEach(q => {
      if (q.querySelector('code, a')) {
        q.prepend(document.createElement(BR_ELEMENT));
      }
    });

    // assuming no <br>'s in <li> sections
    let blocksWithPossibleBrs = [...doc.querySelectorAll(MESSAGE_SECTION_SELECTOR), ...doc.querySelectorAll(MESSAGE_QUOTE_SELECTOR)];
    blocksWithPossibleBrs.forEach(messageBody => {
      // Replace linebreaks marked by <br> tag
      // replace all <br> with <p>*preceding text*</p>
      const brElements = messageBody.querySelectorAll('br');
      if (brElements.length !== 0) {
        let prev = messageBody.firstChild
        brElements.forEach(br => {
          const p = document.createElement('p');
          // find all elements between:
          //  * previous <br/> (already replaced with <p>...</p> at this point) OR the very first sibling (inclusive)
          //  AND
          //  * current <br/>
          // so we can enclose them in their own <p></p>
          const between = getNodeSiblingsBetweenIncludingA(prev, br);
          between.forEach(e => {
            p.appendChild(e);
          });
          br.before(p);
          br.remove();
          prev = p.nextSibling;
        });
        // now wrap all remaining children in a <p>
        const p = document.createElement('p');
        while (prev) {
          let next = prev.nextSibling;
          p.appendChild(prev);
          prev = next;
        }
        messageBody.appendChild(p);
      }
    });

    doc.querySelectorAll(MESSAGE_QUOTE_SELECTOR).forEach(q => {
      if (q.querySelector('code, a')) {
        q.firstChild.innerHTML = '>'; // instead of "Empty quote" placeholder in Notion
      }
    });
    
    if (csvExportFriendly) {
      doc.querySelectorAll(MESSAGE_BODY_SELECTOR).forEach(messageBody => {
          // prepend link text markdown-style
          messageBody.querySelectorAll('a').forEach(a => {
            // handles truncated link text '*link beginning*[...]*remaining link*'
            if (a.textContent.substring(0,81) !== a.href.substring(0,81)) { 
              let atext = a.textContent;
              // Note: this assumes that links from mentions have been removed earlier
              a.textContent = 'link'
              surroundElement(a, '[' + atext + ']({targetElement})')
            }
          });

          messageBody.querySelectorAll('pre').forEach(pre => {
            surroundElement(pre, '&#96;&#96;&#96;{targetElement}&#96;&#96;&#96;');
          });

          // surround with ` backticks
          messageBody.querySelectorAll('code').forEach(code => {
            surroundElement(code, '&#96;{targetElement}&#96;');
          });
      });
    }
    
    if (anonymize) {
      // ANONYMIZE
      function hasExtIcon(e) { // external members of Slack Connect channels will have an icon
        let parentPrevSibl = e.parentElement.previousElementSibling;
        if (parentPrevSibl) { // "Compact" message display style (Preferneces -> Messages & media -> Theme)
          return parentPrevSibl.matches(SLACK_CONNECT_EXT_ICON_SELECTOR);
        } else { // "Clean" message display style
          return e.closest(MESSAGE_CLASS).querySelector(SLACK_CONNECT_EXT_ICON_SELECTOR) != null;
        }
      }

      let names = [...doc.querySelectorAll(SENDER_SELECTOR), ...doc.querySelectorAll(MENTION_SELECTOR)];
      let placeholders = {};
      let i = 0;
      names.forEach(e => {
        let name = e.textContent.trim().replace(/^@/,'');
        if (!placeholders.hasOwnProperty(name)) {
          // find if external or not, set prefix appropriately
          let p = '';
          if (e.matches(SENDER_SELECTOR)) {
            if (hasExtIcon(e)) {
              p = 'Ext_';
            }
          }
          if (i === 0) {
            p += `OP`;
          } else {
            p += `Person_${i}`;
          }
          placeholders[name] = p;
          i++; 
        } else if (placeholders[name] === 'OP') { // sometimes the copied block does not include first sender's icon even if it's there
          if (e.matches(SENDER_SELECTOR)) {
            if (hasExtIcon(e)) {
              placeholders[name] = 'Ext_OP'; // correct after the fact
            }
          }
        }
      });

      // both sender names and mentions
      for (let sender in placeholders) {
        replaceAll(doc, sender, placeholders[sender])
      }

      doc.querySelectorAll(SLACK_CONNECT_EXT_ICON_SELECTOR).forEach(e => {
        e.remove();
      });
    }

    doc.querySelectorAll(SENDER_SELECTOR).forEach(e => {
      e.innerHTML = "<b>" + e.innerHTML + ':</b>';
    });

    // Remove horizontal line + number of replies
      doc.querySelectorAll(SEPARATOR_SELECTOR).forEach(e => {
        e.remove();
      });
    
    doc.querySelectorAll(EDITED_SELECTOR).forEach(e => {
      e.remove();
    });
    
    /// REMOVES duplicate sender name
    doc.querySelectorAll(DUPLICATE_SENDER_SELECTOR).forEach(e => {
      e.remove();
    });

    /// REMOVES AVATARS
    doc.querySelectorAll(AVATAR_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'new messages' divider
    doc.querySelectorAll(NEW_MESSAGES_DIVIDER_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'add reaction' button
    doc.querySelectorAll(ADD_REACTION_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'actions' popup (that shows top 3 emojis; this shows up when you copy a slack thread)
    doc.querySelectorAll(TOP_THREE_EMOJIS_CLASS).forEach(e => {
      e.remove();
    });

     /// REMOVES ATTACHMENTS
    doc.querySelectorAll(ATTACHMENTS_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES CUSTOM STATUS EMOJIS
    doc.querySelectorAll(CUSTOM_STATUS_EMOJI_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES SVGS
    doc.querySelectorAll(SVG_ELEMENT).forEach(e => {
      e.remove();
    });

    /// REPLACES IMGs with their alt text 
    //   (since we've gotten rid of emojis and avatars,
    ///   this should just be uploaded images)
    //   TODO: instead of deleting, ideally we'd either allow image to show up by fixing CORS blockage, 
    //     or else automatically download the image so it can be easily uploaded to notion
    doc.querySelectorAll(ATTACHED_FILES_CONTAINER_CLASS).forEach(imgContainer => {
      const img = imgContainer.querySelector(IMG_ELEMENT)
      if (img) {
        attachmentsDetected += 1
        console.log(img)
        var imgText = document.createElement(PARAGRAPH_ELEMENT);
        imgText.className = 'missing-img'
        var warning = ''
        for(let i = 0; i < 10; i++) {
          warning += emoji.emojify(`:warning:`)
        }
        imgText.innerHTML = `
            ${warning}
            (you must download <a href="${increaseResolution(img.src)}" target="_blank">${img.getAttribute('alt')}</a> 
            and manually add it to Notion) 
            ${warning}`

          imgContainer.parentNode.replaceChild(imgText, imgContainer)
          imgContainer.remove()
      }
    });

    // Add a top info (timestamp + optionally, channelID) to the top of the thread
      const topInfo = document.createElement('div');
      topInfo.className = 'top-info';
      const firstMessage = doc.querySelector(MESSAGE_CLASS)
      if (firstMessage) {
        const parent = firstMessage.parentNode;
        parent.insertBefore(topInfo, firstMessage);
      } else {
        doc.body.insertBefore(topInfo, doc.body.firstChild);
      }

    if (includeChannelId) {
      // FIND CHANNEL ID
      // channel id also appears in 'id' and 'data-qa' attributes of various elements
      // e.g. id="secondary-<CHANNEL_ID>-1712126445.441249-sender"
      // but we will look at just <a> elements for now
      const channelIdCount = new Map(); // just in case there are links to other channels, pick one that appears the most
      doc.querySelectorAll('a').forEach((e) => {
        let m = e.href.match(/^https:\/\/[^./]+.slack.com\/archives\/([A-Z0-9]+)\/.*/);
        if (m) {
            let channelId = m[1];
            channelIdCount.set(channelId, (channelIdCount.get(channelId) || 0) + 1);
        }
      });
      const mostCommonChannelId = [...channelIdCount.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
      doc.querySelector('.top-info').innerHTML = `(Channel ID: ${mostCommonChannelId})`;
    }

    var foundFirstTimestamp = false;
    for(const elm of doc.querySelectorAll(MESSAGE_CLASS)) {
      // Timestamp manipulation is done to avoid getting timestamps reading
      //   "1 day ago" -- someone looking later at a slack dump will have no idea when
      //   "1 day ago" actually was.
      const timestampLink = elm.querySelector(TIMESTAMP_LABEL_CLASS)
      if (timestampLink) {
        const timestamp = timestampLink?.parentElement.getAttribute('data-ts')
        // e.g. Mar 23, 2023
        const humanReadableTimestamp = new Date(timestamp * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
        timestampLink.remove();

        // Apply timestamp only to the first message in the thread
        if (!foundFirstTimestamp) {

            let topInfo = doc.querySelector('.top-info')
            topInfo.innerHTML = humanReadableTimestamp + ' ' + topInfo.textContent;

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

    doc.querySelectorAll(LI_ELEMENT).forEach(e => {
      e.style = 'margin-left: 28px'
    })

    // REMOVES STYLING FROM DIVS
    doc.querySelectorAll(DIV_ELEMENT).forEach(e => {
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

    doc.querySelectorAll('*').forEach(removeDataAttributes)

    // debug
    
    let debugDoc = doc.cloneNode(true)
    debugDoc.querySelectorAll('*').forEach(e => { // remove attributes for readability
      e.removeAttribute('class')
      e.removeAttribute('dir')
      e.removeAttribute('style')
      e.removeAttribute('delay')
    });
    console.log(prettyPrintHTML(new XMLSerializer().serializeToString(debugDoc)));
    

    return [doc, attachmentsDetected]
  }

  export {processDoc};