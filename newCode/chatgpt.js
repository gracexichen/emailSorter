function getElement(elementID) {
	return document.getElementById("email" + elementID);
}

function renderSummary(json, elementID) {
	//edits specified element's textContent to the summary made in getSummary()
	getElement(elementID).textContent = "Summary: " + json.summary;
}

function getSummary(emailObject) {
	//comminucates with chatgpt to get summary of inputted email and calls functions to render the result
	//set up parameter variables for fetch command
	url = "https://gpt-summarization.p.rapidapi.com/summarize";
	data = JSON.stringify({ text: emailObject.body, num_sentences: 1 });
	header = {
		"x-rapidapi-host": "gpt-summarization.p.rapidapi.com",
		"x-rapidapi-key": "aa2eba7f8fmsha65f1a2ea651d41p15ae9fjsnaa60265cace5",
		"content-type": "application/json",
	};
	console.log("summarizing");
	//send ("post") parameters to chatgpt api
	fetch(url, {
		method: "POST",
		body: data,
		headers: header,
	})
		//use the response json (summarized email body put in the summary key) to change the text content of the element
		.then((response) => response.json())
		.then((json) => renderSummary(json, emailObject.index));
}
