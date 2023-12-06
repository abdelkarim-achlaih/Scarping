const axios = require("axios");
const cheerio = require("cheerio");
const xlsx = require("xlsx");
const puppeteer = require("puppeteer");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaPrk5myN8pUUqC_x64KLAku-4LauCELG71VmuzKYO1o7lt3erKXL_LeXMXVO8NZRF1jv2XIHcOjQeK_DCT_4hbZeJKwvcUHsueJfwi0HOxI8uLk_9W675FjqvzvCSnmXiIxTI-P&hl=en-MA&gl=ma&cs=1&ssta=1&q=geneva%20media%20agencies&oq=geneva%20media%20agencies&slp=MgA6HENoTUlvc0NyaTV6NmdnTVZrUVVHQUIzWWF3RFlSAggCYACSAacCCgsvZy8xdGR3MmNmMAoNL2cvMTFoMThuOTBxcgoNL2cvMTFjNDVyMms2bQoML2cvMTJoa250YjdzCg0vZy8xMXE0Y2hwcV9mCgsvZy8xd2Jmejk2YwoNL2cvMTFidG0xMDJxNgoNL2cvMTFoODRyNzg4OAoNL2cvMTFnbXl5MW1rMQoLL2cvMXZfdzE4MnQKDS9nLzExZzZ4OGh0MjQKCy9nLzF0dnEzMDkyCgsvZy8xdnlzdmZjdgoML2cvMTFnXzJwYjRwCg0vZy8xMWI3cm44czgwCgwvZy8xcHR3czBnOTQKDS9nLzExZmoxN3ZuNXYKDS9nLzExZHhmYms5c3QKCy9nLzF0ZjZsMnM0CgsvZy8xdGQyeWM5MxIEEgIIARIECgIIAZoBBgoCFxkQAA%3D%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwjplaaLnPqCAxU5Q6QEHWC0Be0QjGp6BAhWEAE&scp=ChdnY2lkOmFkdmVydGlzaW5nX2FnZW5jeRJVEhIJ6-LQkwZljEcRObwLezWVtqAaEglNSU9cQ2SMRxERgCELFhXfNiITR2VuZXZhLCBTd2l0emVybGFuZCoUDU0rhhsV9FikAx0LbY4bJfVbrgMwABoObWVkaWEgYWdlbmNpZXMiFWdlbmV2YSBtZWRpYSBhZ2VuY2llcyoSQWR2ZXJ0aXNpbmcgYWdlbmN5"; // Replace with your desired URL
const excelFileName = "newyork.xlsx";
const city = "newyork"; // Replace with the desired city
const country = "USA"; // Replace with the desired country

displayMediaAgenciesAndEmails(baseUrl, excelFileName, city, country);

let stars = (num) => ` ${"*".repeat(num)} `;
// Function to extract website URLs from a given webpage
async function extractWebsiteUrls(baseUrl) {
	let lastScrapedPage;
	return await scrapePages(baseUrl, 20);

	async function scrapePages(baseUrl, maxPages = 3) {
		const browser = await puppeteer.launch({ headless: "new" });
		const page = await browser.newPage();
		let allWebsiteUrls = []; // Variable to store all website URLs
		let continueScraping = true;
		try {
			// Navigate to the initial URL
			await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

			// Wait for a specific content element to be present on the page
			await page.waitForSelector(`button[aria-label="Next"]`, {
				timeout: 60000,
			});
			console.log(
				stars(10),
				"Start Scarping Google Local Services: Fetching For Media Agencies URLs",
				stars(10)
			);
			for (
				let pageCounter = 0;
				pageCounter < maxPages && continueScraping;
				pageCounter++
			) {
				// Get links from the current page
				const websiteUrls = await getLinks(page);

				allWebsiteUrls = allWebsiteUrls.concat(websiteUrls);

				// Do something with the extracted website URLs
				// console.log(`Page ${pageCounter + 1} - Website URLs:`, websiteUrls);
				console.log(
					stars(2),
					`Scarping Page ${pageCounter + 1} of ${maxPages}`,
					stars(2)
				);
				lastScrapedPage = pageCounter + 1;
				// Navigate to the next page and update the flag based on button presence
				continueScraping = await navigateToNextPage(page);
			}

			// Log the combined array after the loop finishes
			let tmp = new Set(allWebsiteUrls);
			let uniqueWebsiteUrls = Array.from(tmp);
			// console.log("All Website URLs:", uniqueWebsiteUrls);
			console.log(
				stars(5),
				"Number Of Website URLs Fetched:",
				uniqueWebsiteUrls.length,
				"Unique URL",
				stars(5)
			);

			// ********** Final ******************

			return uniqueWebsiteUrls;

			// ********** Final ******************
		} catch (error) {
			console.error("Error during page navigation:", error);
		} finally {
			// Close the browser
			await browser.close();
		}
	}

	async function getLinks(page) {
		try {
			// Extract href attributes from a elements with aria-label="Website"
			const websiteUrls = await page.$$eval(
				'a[aria-label="Website"]',
				(elements) => {
					return elements.map((element) => element.href);
				}
			);
			return websiteUrls;
		} catch (error) {
			console.error("Error extracting website URLs:", error.message);
			return [];
		}
	}

	async function navigateToNextPage(page) {
		try {
			// Check if the "Next" button is present
			const nextButton = await page.$('button[aria-label="Next"]');
			if (nextButton) {
				// Simulate a click on the "Next" button
				await Promise.all([
					page.waitForNavigation({ waitUntil: "domcontentloaded" }),
					page.click('button[aria-label="Next"]'),
				]);

				// Wait for the content to be updated
				await page.waitForFunction(
					() => {
						// Replace this condition with one that suits your website's behavior
						// Check if the new content has loaded or if a specific element is present
						return document.querySelector("div[data-website-url]") !== null;
					},
					{ timeout: 60000 }
				); // Adjust the timeout as needed

				return true; // Continue scraping
			} else {
				console.log(
					stars(5),
					"End of pagination at page:",
					lastScrapedPage,
					stars(5)
				);
				return false; // Stop scraping
			}
		} catch (error) {
			console.error("Error navigating to the next page:", error);
			return false; // Stop scraping on error
		}
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
