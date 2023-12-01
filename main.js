const axios = require("axios");
const cheerio = require("cheerio");
const xlsx = require("xlsx");
const puppeteer = require("puppeteer");

// Example usage
const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaO9bplSST1oDj2TNxdveYvPKk3czDpsN1oeg3ciJjEbP4YM67F54Ysxg8m9u4mb9Ir2y9tTMWKw3t6RO7QYxn0un9ogyFKpsmKwS1l46mrM_IYW2G4TOnqdZrjedTY3jcmFETa-Ukdf9UvWYPoK9EoxhsqGQg%3D%3D&hl=en-MA&gl=ma&cs=1&ssta=1&q=media%20agencies%20in%20dubai&oq=media%20agencies%20in%20dubai&slp=MgA6HENoTUk1WmlNaktyc2dnTVYySjlvQ1IySHJRTWJSAggCYACSAa8CCgsvZy8xdGZweTl6ZgoNL2cvMTFmZ2tueHYwYgoML2cvMTFoMXIzcXcyCg0vZy8xMWoxZmRrNjlyCg0vZy8xMWhfd3kyNjI1Cg0vZy8xMWYxMjcwNXF5Cg0vZy8xMWJ0X253Z2hfCg0vZy8xMWI2aF9kdnM1CgsvZy8xdGo2czliZgoML2cvMXB0eXFuczZ2CgsvZy8xdGZtbHc0NwoNL2cvMTFqN2tjNjF0MAoNL2cvMTFma2pkNHh3NgoML2cvMWhjYmgzaDE3Cg0vZy8xMWh6d2QxeHBxCg0vZy8xMWcxOXY1c3Y1Cg0vZy8xMWZfZDA0ZjJuCg0vZy8xMWtjeDk2bXZ6Cg0vZy8xMWwzY2QwMDZnCg0vZy8xMWNteXlkc3luEgQSAggBEgQKAggBmgEGCgIXGRAA&src=2&serdesk=1&sa=X&ved=2ahUKEwiKwoaMquyCAxXVfKQEHS_ABWcQjGp6BAgnEAE&scp=ChdnY2lkOmFkdmVydGlzaW5nX2FnZW5jeRJeEhIJRcbZaklDXz4RYlEphFBu5r0aEglFxtlqSUNfPhHpKQArv9DOdCIcRHViYWkgLSBVbml0ZWQgQXJhYiBFbWlyYXRlcyoUDXovxw4VX563IB3HaB0PJSB5HiEwABoObWVkaWEgYWdlbmNpZXMiF21lZGlhIGFnZW5jaWVzIGluIGR1YmFpKhJBZHZlcnRpc2luZyBhZ2VuY3k%3D"; // Replace with your desired URL
const excelFileName = "output.xlsx";
const city = "Dubai"; // Replace with the desired city
const country = "United Arab Emirates"; // Replace with the desired country

displayMediaAgenciesAndEmails(baseUrl, excelFileName, city, country);

// Function to extract website URLs from a given webpage
async function extractWebsiteUrls(baseUrl) {
	try {
		const response = await axios.get(baseUrl);
		const $ = cheerio.load(response.data);

		// Extract href attributes from a elements with aria-label="Website"
		const websiteUrls = $("div[data-website-url]")
			.map((index, element) => {
				return $(element).attr("data-website-url");
			})
			.get();

		return websiteUrls;
	} catch (error) {
		console.error("Error extracting website URLs:", error.message);
		return [];
	}
}

// Function to extract contact email from a website
async function extractEmail(url) {
	const contactPageVariations = [
		/* add more variations as needed */ "/contact",
		"/contact-us",
		"/contactus",
	];

	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);

		const emailAddresses = $('a[href^="mailto:"]')
			.map((index, element) => {
				return $(element).attr("href").replace("mailto:", "");
			})
			.get();

		const uniqueEmailAddresses = Array.from(new Set(emailAddresses));

		if (uniqueEmailAddresses.length === 0) {
			// If no email found, try variations of contact pages using Puppeteer
			const browser = await puppeteer.launch({
				headless: "new",
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--disable-gpu",
					"--disable-devtools-extension",
					"--disable-web-security",
				],
			});
			const page = await browser.newPage();

			for (const contactVariation of contactPageVariations) {
				const contactPageUrl = url + contactVariation;
				await page.goto(contactPageUrl, { waitUntil: "domcontentloaded" });
				const contactContent = await page.content();

				const contact$ = cheerio.load(contactContent);

				const contactEmailAddresses = contact$('a[href^="mailto:"]')
					.map((index, element) => {
						return contact$(element).attr("href").replace("mailto:", "");
					})
					.get();

				const uniqueContactEmailAddresses = Array.from(
					new Set(contactEmailAddresses)
				);

				if (uniqueContactEmailAddresses.length > 0) {
					await browser.close();
					return uniqueContactEmailAddresses;
				}
			}

			await browser.close();
		}

		return uniqueEmailAddresses;
	} catch (error) {
		console.error(`Error extracting email from ${url}:`, error.message);
		return [];
	}
}
// Function to extract agency name from the URL
function extractAgencyName(url) {
	// Remove "www." if it exists, then split by dots
	const urlWithoutWWW = url.replace("www.", "");
	const urlParts = urlWithoutWWW.split(".");

	// Assuming the agency name is the second part of the URL
	return urlParts.length >= 2 ? urlParts[1] : "Unknown";
}

async function displayMediaAgenciesAndEmails(
	baseUrl,
	excelFileName,
	city,
	country
) {
	// Extract and display website URLs
	const websiteUrls = await extractWebsiteUrls(baseUrl);

	// Extract and display emails from each website URL
	const data = [];
	for (const url of websiteUrls) {
		const emails = await extractEmail(url);
		const agencyName = extractAgencyName(url); // Extract agency name from the URL (for demonstration purposes)

		// Push data to the array
		data.push({ agencyName, url, city, country, emails: emails.join(", ") });
	}

	// Export data to an Excel file
	await exportToExcel(data, excelFileName);
}

// Function to export data to an Excel file
async function exportToExcel(data, excelFileName) {
	try {
		const headers = Object.keys(data[0]); // Assuming all objects have the same keys

		// Create a worksheet with headers and data
		const worksheet = xlsx.utils.json_to_sheet(data, { header: headers });

		// Create a new workbook
		const workbook = xlsx.utils.book_new();

		// Add the worksheet to the workbook
		xlsx.utils.book_append_sheet(workbook, worksheet, "Media Agencies");

		// Write the Excel workbook to a file
		xlsx.writeFile(workbook, excelFileName);

		console.log(`Data exported to ${excelFileName}`);
	} catch (error) {
		console.error("Error exporting data to Excel file:", error.message);
	}
}
