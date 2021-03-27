const https = require("https");

function httpRequest(params, postData) {
	return new Promise(function (resolve, reject) {
		let req = https.request(params, function (res) {
			// reject on bad status
			if (res.statusCode < 200 || res.statusCode >= 300)
				return reject(new Error('statusCode=' + res.statusCode));

			let body = [];
			res.on('data', data => body.push(data));
			// resolve on end
			res.on('end', function () {
				try {
					body = JSON.parse(Buffer.concat(body).toString());
					resolve(body);
				} catch (e) {
					reject(e);
				}
			});
		});
		// reject on request error
		req.on('error', reject);

		postData && req.write(postData);
		req.end();
	});
}



function jsonPost(host, path, data, header) {
	const body = JSON.stringify(data);
	const jsonHeader = {
		"Content-Type": "application/json",
		"Content-Length": `${body.length}`
	}
	const headers = header ? { ...header, ...jsonHeader } : jsonHeader;
	const options = {
		method: "POST",
		hostname: host,
		path,
		headers,
	};
	return httpRequest(options, body)
}

var reqData = {
	"id": "ID",
	"method": "authenticate",
	"jsonrpc": "2.0",
	params: {
		user: "STG12/2",
		password: "DatenSicherheit2020!"
	}
};

const encodeSchoolname = name => "?school=" + encodeURIComponent(name).replace("%20", "+");

const untisSrv = "mese.webuntis.com";
const jsonrpc = "/WebUntis/jsonrpc.do";
let info;
const path = jsonrpc + encodeSchoolname("GS Tübingen");
console.log(path);
jsonPost(untisSrv, path, reqData)
	.then(data => info = data.result)
	.then(() => {
		console.log(info)
		reqData.method = "getTimetable";
		reqData.params = {
			options: {
				element: {
					type: info.personType,
					id: info.personId,
				},
				showSubstText: true,
				showLsText: true,
				roomFields: ["name"],
				subjectFields: ["name"],
				teacherFields: ["name"]
			}
		}
		jsonPost(untisSrv, jsonrpc, reqData, { "Cookie": "JSESSIONID=" + info.sessionId }).then(data => console.log(data.result[0]))

	})
	.catch(console.error);