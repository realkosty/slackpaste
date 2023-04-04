// taken from https://stackoverflow.com/a/59462028
const copyToClipboard = () => {
    const element = document.getElementById('formatted-output')
    if (!element.innerText) {
      console.log("nothing to copy, returning")
      return
    }
    window.getSelection().removeAllRanges();
    let range = document.createRange();
    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    alert('copied output to the clipboard')
  }

  export { copyToClipboard }