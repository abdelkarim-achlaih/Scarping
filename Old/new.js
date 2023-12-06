const axios = require("axios");
const cheerio = require("cheerio");
const xlsx = require("xlsx");

// Function to search for media agencies in a specific area
async function searchMediaAgencies(area, apiKey, cx, start = 1, num = 10) {
	try {
		const query = `Media agencies in ${area}`;
		const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
			query
		)}&key=${apiKey}&cx=${cx}&startIndex=${start}&count=${num}`;

		const response = await axios.get(apiUrl);
		const mediaAgencyUrls = response.data.items.map((item) => item.link);

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

// Function to display data on the console and export to an Excel file
async function displayMediaAgencies(area, apiKey, cx, excelFileName) {
	const numResultsPerPage = 20; // Number of results to fetch per page
	let start = 1;
	let allMediaAgencyUrls = [];

	// Fetch results until no more pages are available
	while (true) {
		const mediaAgencyUrls = await searchMediaAgencies(
			area,
			apiKey,
			cx,
			start,
			numResultsPerPage
		);

		if (mediaAgencyUrls.length === 0) {
			break; // No more results
		}

		allMediaAgencyUrls = allMediaAgencyUrls.concat(mediaAgencyUrls);
		start += numResultsPerPage;
	}

	// Extract and display media agencies in the console
	const data = [];
	for (const url of allMediaAgencyUrls) {
		const email = await extractEmail(url);
		if (email) {
			const agencyName = url.split(".")[1]; // Extract agency name from the URL (for demonstration purposes)
			data.push({ agencyName, email });
			console.log(`${agencyName}: ${email}`);
		}
	}

	// Export data to an Excel file
	await exportToExcel(data, excelFileName);
}

// Example usage
const area = "Dubai";
const apiKey = "AIzaSyAgzD2MrqcqSsy1lFcmBjXJvEQOyok1vi8";
const cx = "762d1fe2df8a44007";
const excelFileName = "output.xlsx";

displayMediaAgencies(area, apiKey, cx, excelFileName);
