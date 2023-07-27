//global variables
messageList = [];
emailGlobalCount = 0;

chrome.identity.getAuthToken({ interactive: true }, authorize); //authorizes the user if user is logged in, prompts login in not, then calls the authorize function

/**
 * gets the user profile information
    - fetches from gmail api using an authorization token: https://gmail.googleapis.com/gmail/v1/users/me/profile
    - convert data to json and update the email address displayed
 * @param {string} token - authorization token used to gain access to gmail api
 */
function getProfile(token) {
	fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
		method: "GET",
		headers: new Headers({ Authorization: "Bearer " + token }),
	})
		.then((data) => data.json())
		.then((info) => {
			document.getElementById("profile-email").textContent =
				"Email: " + info.emailAddress;
		});
}

/**
 * authorizes the user and accesses gmail api, gets and displays all the messages
 * @param {string} token - authorization token used to gain access to gmail api
 */
function authorize(token) {
	currentToken = token;
	if (token) {
		getProfile(token);
		console.log("success");
		fetch(
			"https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10&orderBy=internalDate&sortOrder=desc",
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
							console.log(email);
							const mail = new Email(email);
							messageList.push(mail);
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
	url =
		"https://gmail.googleapis.com/gmail/v1/users/me/messages/" +
		gmailKey +
		"/modify";
	data = JSON.stringify({
		removeLabelIds: ["UNREAD"],
	});
	header = { Authorization: "Bearer " + token };

	//send parameters to gmail api
	//POST https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/{id}/modify
	fetch(url, {
		method: "POST",
		body: data,
		headers: header,
	}).then((data) => data.json());

	document
		.getElementById("content")
		.removeChild(document.getElementById(index));

	emailGlobalCount--;
	console.log("count " + emailGlobalCount);
	if (emailGlobalCount === 0) {
		chrome.identity.getAuthToken({ interactive: false }, authorize);
	}
}

class Email {
	constructor(email) {
		this.email = email;
		this.body = this.findMessage();
		this.index = emailGlobalCount++;
		this.subject = null;
		this.from = null;
		this.date = null;
		this.setInformation();
	}

	/**
	 * retrieve message from email based on the type of the message
	 * @returns {string} - retrieved message
	 */
	findMessage() {
		let message = "";
		if (this.email.payload.mimeType === "multipart/alternative") {
			console.log("multipart");
			message = this.convertMessage(this.email.payload.parts[0].body.data);
		} else if (this.email.payload.mimeType === "text/html") {
			console.log("singlepart");
			message = this.convertMessage(this.email.payload.body.data);
		}
		return message;
	}

	/**
	 * when the header is "from", "subject", or "date", set the corresponding instances variables with the information stored in the header
	 */
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
	 * @return {string} - converted message
	 */
	convertMessage(unconvertedMessage) {
		unconvertedMessage = unconvertedMessage.replace(/_/g, "");
		unconvertedMessage = unconvertedMessage.replace(/=/g, "");
		unconvertedMessage = unconvertedMessage.replace(/-/g, "");
		unconvertedMessage.substring(0, unconvertedMessage.length - 1);
		const paddingChar = "a";
		const paddingLength =
			unconvertedMessage.length % 4 === 0
				? 0
				: 4 - (unconvertedMessage.length % 4);
		unconvertedMessage = unconvertedMessage + paddingChar.repeat(paddingLength);
		console.log(unconvertedMessage);
		let converted = atob(unconvertedMessage);
		console.log("message displayed: " + converted);
		return converted;
	}

	/**
	 * adds message to html div container
        - adds a hr element (line) in between the email messages
	 */
	displayMessage(emailID, token) {
		const from = document.createElement("p");
		from.className = "from";
		from.textContent = "From: " + this.from;

		const date = document.createElement("p");
		date.className = "date";
		date.textContent = "Date: " + this.date;

		const subject = document.createElement("p");
		subject.className = "subject";
		subject.textContent = "Subject: " + this.subject;

		const msg = document.createElement("p");
		msg.className = "body";
		msg.id = "email" + this.index;
		getSummary(this);

		const bttn = document.createElement("button");
		bttn.className = "button";
		bttn.index = this.index;
		bttn.gmailKey = emailID;
		bttn.gmailToken = token;
		bttn.textContent = "X Mark As Read";
		bttn.addEventListener("click", () => {
			closeMessage(bttn.index, bttn.gmailKey, bttn.gmailToken);
		});

		const newEmail = document.createElement("div");
		newEmail.id = this.index;
		newEmail.className = "email";

		document.getElementById("content").appendChild(newEmail);
		document.getElementById(newEmail.id).appendChild(date);
		document.getElementById(newEmail.id).appendChild(from);
		document.getElementById(newEmail.id).appendChild(subject);
		document.getElementById(newEmail.id).appendChild(msg);
		document.getElementById(newEmail.id).appendChild(bttn);
	}
}
