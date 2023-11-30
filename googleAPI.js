const axios = require("axios");
const cheerio = require("cheerio");
const xlsx = require("xlsx");
const fs = require("fs");

// Function to search for media agencies in a specific area

async function searchMediaAgencies(area, apiKey, cx) {
	try {
		const query = `Media agencies in ${area}`;
		const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
			query
		)}&key=${apiKey}&cx=${cx}`;
		console.log(apiUrl);

		const response = await axios.get(apiUrl);
		const mediaAgencyUrls = response.data.items.map((item) => item.link);
		console.log(mediaAgencyUrls);
		return mediaAgencyUrls;
	} catch (error) {
		console.error("Error performing web search:", error.message);
		return [];
	}
}

// Function to extract contact email from a website

async function extractEmail(url) {
	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);
		const emailElement = $('a[href^="mailto:"]').first();

		if (emailElement) {
			const email = emailElement.attr("href").replace("mailto:", "");
			return email;
		} else {
			return null;
		}
	} catch (error) {
		console.error(`Error extracting email from ${url}:`, error.message);
		return null;
	}
}

// Function to export data to an Excel file
async function exportToExcel(data, excelFileName) {
	try {
		const worksheet = xlsx.utils.json_to_sheet(data);
		const workbook = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(workbook, worksheet, "Media Agencies");

		// Write the Excel workbook to a file
		xlsx.writeFile(workbook, excelFileName);

		console.log(`Data exported to ${excelFileName}`);
	} catch (error) {
		console.error("Error exporting data to Excel file:", error.message);
	}
}

let myTable = [
	"https://flick.ae/media-production-company-dubai/?gad_source=1&gclid=Cj0KCQiA35urBhDCARIsAOU7Qwlg4ikEKQ3L__cM-UsGmsIsHeuUR70h1DX5YPbmcBHqRLVeJMp-9yAaAmvDEALw_wcB",
	"https://a10tion.com/?gad_source=1&gclid=Cj0KCQiA35urBhDCARIsAOU7QwmlDSjSdE1HgTeDt78Ah0fR8xb1QgILSzbvC5E3QfWAI0cpkH5_1fQaAiE1EALw_wcB",
	"https://www.prism-me.com/",
	"https://scarletmedia.net/",
	"https://www.scratchcom.com/",
];

// Function to display data on the console and export to an SQL file
async function displayMediaAgencies(area, apiKey, cx, excelFileName) {
	// Search for media agencies in the specified area
	// const mediaAgencyUrls = await searchMediaAgencies(area, apiKey, cx);
	const mediaAgencyUrls = myTable;

	// Extract and display media agencies in the console
	const data = [];
	for (const url of mediaAgencyUrls) {
		const email = await extractEmail(url);
		if (email) {
			const agencyName = url.split(".")[1]; // Extract agency name from the URL (for demonstration purposes)
			data.push({ agencyName, email });
			console.log(`${agencyName}: ${email}`);
		}
	}

	// Export data to an SQL file
	await exportToExcel(data, excelFileName);
}

const area = "Dubai"; //your_specific_area
const apiKey = "AIzaSyAgzD2MrqcqSsy1lFcmBjXJvEQOyok1vi8"; //YOUR_GOOGLE_API_KEY
const cx = "762d1fe2df8a44007"; //YOUR_CUSTOM_SEARCH_ENGINE_ID

// Example usage
// const area = "your_specific_area";
// const apiKey = "YOUR_GOOGLE_API_KEY";
// const cx = "YOUR_CUSTOM_SEARCH_ENGINE_ID";
const excelFileName = "output.xlsx";

displayMediaAgencies(area, apiKey, cx, excelFileName);
