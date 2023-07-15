
function getElement(elementID) {
  return document.getElementById(elementID)
}

function render(output, elementID) {
  getElement(elementID).textContent = output.summary;
}

function getSummary(emailObject, elementID) {
    //set up parameter variables for fetch command
  url = "https://gpt-summarization.p.rapidapi.com/summarize"
  data = JSON.stringify({"text": emailObject.body, "num_sentences": 1})
  header = {
    'x-rapidapi-host': "gpt-summarization.p.rapidapi.com",
    'x-rapidapi-key': "aa2eba7f8fmsha65f1a2ea651d41p15ae9fjsnaa60265cace5",
    'content-type': "application/json"
    }

    //send ("post") data to chatgpt api
  fetch(url, {
    method: "POST",
    body: data,
    headers: header
    })

    //use the response json (summarized email body put in the summary key) to change the text content of the element
  .then((response) => response.json())
  .then((json) => render(json, elementID))
}
