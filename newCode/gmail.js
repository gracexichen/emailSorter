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
							mail.displayMessage();
						});
				});
			});
	} else {
		console.log("No authorization. Error: " + chrome.runtime.lastError);
	}
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
	displayMessage() {
		const from = document.createElement("p");
		from.textContent = "From: " + this.from;
		console.log(from.id);

		const subject = document.createElement("p");
		subject.textContent = "Subject: " + this.subject;
		console.log(subject.id);

		const date = document.createElement("p");
		date.textContent = "Date: " + this.date;
		console.log(date.id);

		const msg = document.createElement("p");
		msg.id = "email" + this.index;
		console.log(msg.id);
		getSummary(this, "email" + this.index);

		const linebreak = document.createElement("hr");

		document.getElementById("content").appendChild(date);
		document.getElementById("content").appendChild(from);
		document.getElementById("content").appendChild(subject);
		document.getElementById("content").appendChild(msg);
		document.getElementById("content").appendChild(linebreak);
	}
}