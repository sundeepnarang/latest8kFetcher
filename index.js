const request = require("request");
const fs = require("fs");
const parseString = require('xml2js').parseString;

const requestUrl = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=8-K&company=&dateb=&owner=exclude&start=0&count=100&output=atom";
const readFromFile = true;

const  tempXMLPath = `${__dirname}/temp.xml`;
const  tempJSONPath = `${__dirname}/temp.json`;

function writeFile({path,data}={},done=()=>{}){
	fs.writeFile(path,data,done);
}



function parseXML(xml){
	const parsedJSON = {};
	parseString(xml, function (err, result) {
		result.feed.entry.forEach(({title, summary, link, category,id,updated})=>{
			title = title[0];
			link = link[0].$.href;
			id = id[0];
			updated = updated[0].replace("T"," ");
			const accNum = id.replace(/^.*accession-number=(\d{10}\-\d{2}\-\d{6}).*$/i, "$1");
			const formType = category[0].$.term;
			summary = summary[0]._.split("<br>");
			let [ignore, ...items] = summary;
			items = items.map(d=>d.replace(/^Item (\d\.\d\d):.*\n?/i,"$1"));
			parsedJSON[accNum] = {
				title,link,accNum,formType,items,updated
			};
			writeFile({path:tempJSONPath,data:JSON.stringify(parsedJSON,null,2)})
		})
	    
	});
}

if(readFromFile){
	fs.readFile(tempXMLPath,(err,data)=>{
		if(err){
			return console.log("err : ",err);
		}	
		parseXML(data);
	});
} else {
	request(requestUrl,(err,res,body)=>{
		if(err){
			return console.log("err : ",err);
		}
		writeFile({path:tempXMLPath,data:body},()=>{
			parseXML(body);
		});
	});
}
