messageList = []; //empty message list
emailGlobalCount = 0;

chrome.identity.getAuthToken({ interactive: true }, authorize); //authorizes the user if user is logged in, prompts login in not, then calls the authorize function
chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, profile); //gets the profile of use logged in, then calls profile function <-- unused right now

/**
 * Gets the user info of profile logged in
 * @param {ProfileUserInfo} user_info - object with user id and user email
 */
function profile(user_info) {
	if (user_info) {
		console.log(user_info.email);
	} else {
		console.log("no user info, sorry");
	}
}

/**
 * authorizes the user and accesses gmail api, gets and displays all the messages
 * @param {string} token - authorization token used to gain access to gmail api
 */
function authorize(token) {
	if (token) {
		console.log("success");
		fetch(
			"https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
			{
				method: "GET",
				headers: new Headers({ Authorization: "Bearer " + token }),
			}
		)
			.then((data) => data.json())
			.then((info) => {
				info.messages.forEach((element) => {
					fetch(
						"https://www.googleapis.com/gmail/v1/users/me/messages/" +
							element.id,
						{
							method: "GET",
							headers: new Headers({ Authorization: "Bearer " + token }),
						}
					)
						.then((data) => data.json())
						.then((email) => {
							const mail = new Email(email);
							messageList.push(mail);
							//console.log(email.labelIds)
							mail.displayMessage(element.id, token);
						});
				});
			});
	} else {
		console.log("No authorization. Error: " + chrome.runtime.lastError);
	}
}

/**
 * completes steps to close a message:
    - communicates with gmail to mark specified email as read (posts an update to the specified email's labels list, removing the UNREAD label)
    - deletes HTML elements representing specified Email instance and then, deletes specified Email instance
 * @param {string} index - unique index number of an email instance that is appended to "email" to make its html element ID
 * @param {string} gmailKey - unique id of each email used to specify the email to fetch-modify to gmail
 * @param {string} token - authorization token used to gain access to gmail api
 */
function closeMessage(index, gmailKey, token) {
	//set up parameter variables for fetch command
	url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + gmailKey + "/modify";
	data = JSON.stringify({
		"removeLabelIds": [
		  "UNREAD"
		]
	  });
	header = { Authorization: "Bearer " + token };
	
	//send parameters to gmail api
	//POST https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/{id}/modify
	fetch(url, {
		method: "POST",
		body: data,
		headers: header,
	})

	.then((data) => data.json())
	.then((email) => console.log(email.labelIds))

	document.getElementById("content").removeChild(document.getElementById("from"+index))
	document.getElementById("content").removeChild(document.getElementById("subject"+index))
	document.getElementById("content").removeChild(document.getElementById("date"+index))
	document.getElementById("content").removeChild(document.getElementById("email"+index))
	document.getElementById("content").removeChild(document.getElementById("button"+index))
	document.getElementById("content").removeChild(document.getElementById("linebreak"+index))
}



class Email {
	constructor(email) {
		this.email = email;
		this.body = this.convertMessage(email.payload.parts[0].body.data);
		this.index = emailGlobalCount++;
		this.subject = null;
		this.from = null;
		this.date = null;
		this.setInformation();
	}

	setInformation() {
		this.email.payload.headers.forEach((header) => {
			if (header.name === "From") {
				this.from = header.value;
			} else if (header.name === "Subject") {
				this.subject = header.value;
			} else if (header.name === "Date") {
				this.date = header.value;
			}
		});
	}

	/**
	 * converts message from base64 to string
	 * @param {base64} unconvertedMessage - message encoded by base64
	 * @return {string} converted - converted message to string
	 */
	convertMessage(unconvertedMessage) {
		unconvertedMessage = unconvertedMessage.replace(/_/g, "");
		unconvertedMessage = unconvertedMessage.replace(/=/g, "");
		unconvertedMessage = unconvertedMessage.replace(/-/g, "");
		let converted = atob(unconvertedMessage);
		return converted;
	}

	/**
	 * adds message to html div container
	 * adds a hr element (line) in between the email messages
	 */
	displayMessage(emailID, token) {
		console.log(emailID)
		//console.log(token)
		const from = document.createElement("p");
		from.id = "from" + this.index
		from.textContent = "From: " + this.from;
		console.log(from.id);

		const subject = document.createElement("p");
		subject.id = "subject" + this.index
		subject.textContent = "Subject: " + this.subject;
		console.log(subject.id);

		const date = document.createElement("p");
		date.id = "date" + this.index
		date.textContent = "Date: " + this.date;
		console.log(date.id);

		const msg = document.createElement("p");
		msg.id = "email" + this.index;
		console.log(msg.id);
		getSummary(this);

		const bttn = document.createElement("button")
		bttn.id = "button" + this.index;
		bttn.index = this.index;
		bttn.gmailKey = emailID;
		bttn.gmailToken = token;
		bttn.textContent = "X"
		bttn.addEventListener('click', () => {closeMessage(bttn.index, bttn.gmailKey, bttn.gmailToken)})

		const linebreak = document.createElement("hr");
		linebreak.id = "linebreak" + this.index;

		document.getElementById("content").appendChild(date);
		document.getElementById("content").appendChild(from);
		document.getElementById("content").appendChild(subject);
		document.getElementById("content").appendChild(msg);
		document.getElementById("content").appendChild(bttn);
		document.getElementById("content").appendChild(linebreak);
	}
}
