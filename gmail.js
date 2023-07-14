messageList = []; //empty message list
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
						})
						.then(() => {
							messageList.forEach((mail) => {
								mail.displayMessage();
							});
						});
				});
			});
	} else {
		console.log("No authorization. Error: " + chrome.runtime.lastError);
	}
}

class Email {
	constructor(email) {
		this.body = this.convertMessage(email.payload.parts[0].body.data);
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
		const msg = document.createElement("p");
		msg.innerHTML = this.body;

		const linebreak = document.createElement("hr");

		document.getElementById("content").appendChild(msg);
		document.getElementById("content").appendChild(linebreak);
		console.log("yess");
	}
}
