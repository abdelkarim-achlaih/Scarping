const axios = require("axios");
const cheerio = require("cheerio");
const xlsx = require("xlsx");
const puppeteer = require("puppeteer");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaPtBEXZ7WnPTZ8gsHQcATFlmemjy79oQOjpXd3WWPDdpIoYFKR_yWAr5ZiZpmX8SQgybbPnkstGcZFEiuxOT6wB9l6_W1mHyyHoJ6X6pVry7JogBy2CtlS2z3QIPSxkieoIR-YU6KBGf_qzmADdHjQKlaaSnA%3D%3D&hl=en-MA&gl=ma&cs=1&ssta=1&q=media%20agencies%20in%20new%20york&oq=media%20agencies%20in%20new%20york&slp=MgA6HENoTUktNVNBczRmdGdnTVZWSWRvQ1IxWVJndWFSAggCYACSAaYCCg0vZy8xMWp0eGZ4M3gyCgsvZy8xdGRjc2Z4cgoNL2cvMTFnbjF4NV9nNAoNL2cvMTFoNXZ6NzhteQoNL2cvMTFiY2NtYmJyawoNL2cvMTFmMjR2ZzNnaAoNL2cvMTFoZjNsZnpuYwoLL2cvMXRkaGZ4enQKCy9nLzF0ZHZfdDNmCgsvZy8xeGIyZmhicwoML2cvMWhjMngxcTN6Cg0vZy8xMWNsdjZyaDBoCgsvZy8xdGwxcGMxNgoLL2cvMXRkanMxZGMKCy9nLzF0bjA2cWQ5Cg0vZy8xMWpjbGZqcHd5CgwvZy8xaGMzNG00M3QKCy9nLzF0dGR6YzdwCg0vZy8xMWo0eTBjNDY3Cg0vZy8xMWpteXJrazV5EgQSAggBEgQKAggBmgEGCgIXGRAA&src=2&serdesk=1&sa=X&ved=2ahUKEwjoiPuyh-2CAxWVRaQEHfQFBeYQjGp6BAgqEAE&scp=ChdnY2lkOmFkdmVydGlzaW5nX2FnZW5jeRJTEhIJOwg_06VPwokRYv534QaPC8gaEgmppSPx8EvMTBFnlRjewcbP3SIRTmV3IFlvcmssIE5ZLCBVU0EqFA1nXCAYFU32vNMd24ZjGCUfOxLUMAAaDm1lZGlhIGFnZW5jaWVzIhptZWRpYSBhZ2VuY2llcyBpbiBuZXcgeW9yayoSQWR2ZXJ0aXNpbmcgYWdlbmN5"; // Replace with your desired URL
const excelFileName = "newyork.xlsx";
const city = "newyork"; // Replace with the desired city
const country = "USA"; // Replace with the desired country

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
	// Remove protocol and split by dots
	const urlWithoutProtocol = url.replace(/^(https?:\/\/)?(www\.)?/, "");
	const urlParts = urlWithoutProtocol.split(".");

	// Assuming the agency name is the first part of the remaining URL
	return urlParts.length >= 1 ? urlParts[0] : "Unknown";
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
