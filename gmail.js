chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, profile);
chrome.identity.getAuthToken({ interactive: true }, authorize);

function profile(user_info) {
	if (user_info) {
		console.log(user_info.email);
	} else {
		console.log("no user info, sorry");
	}
}
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
						.then((message) => process_message(message));
				});
			});
	} else {
		console.log("No authorization. Error: " + chrome.runtime.lastError);
	}
}

function process_message(message) {
	let string = message.payload.parts[0].body.data;
	string = string.replace(/_/g, "");
	string = string.replace(/=/g, "");
	string = string.replace(/-/g, "");
	// console.log(string);
	// console.log(atob(string));
	let converted_message = atob(string);
	const msg = document.createElement("p");
	msg.innerHTML = converted_message;

	const linebreak = document.createElement("hr");

	document.getElementById("content").appendChild(msg);
	document.getElementById("content").appendChild(linebreak);
}
