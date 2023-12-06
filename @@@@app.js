const xlsx = require("xlsx");
const puppeteer = require("puppeteer");
const path = require("path");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaMDAMMNJYCa2G72BVpbYV_Zih1NxT8ROoLA6WQaFfuTbAUEkKAOubUGCr4dVW-Hse7CtfwHO7semNLEdBhgGKk3G0WTKquGgpeHotXI3BtRp0G1zE6W6a6OmqtCLNLGlaYHrGth&hl=en-MA&gl=ma&cs=1&ssta=1&q=manchester%20media%20agencies&oq=manchester%20media%20agencies&slp=MgA6HENoTUlndTNENjdQNmdnTVZQRDRHQUIzTVNBemZSAggCYACSAasCCg0vZy8xMWZnNjBkXzczCg0vZy8xMWowdzlnMjh3CgwvZy8xaGRfdjVyNzkKDS9nLzExaDhqenhzbGgKDS9nLzExY20weDJjdGsKDS9nLzExYzVidDBqanIKDS9nLzExYndfNTZxajAKDS9nLzExZHliZmhyX20KDS9nLzExYzZ5ejl6bngKDS9nLzExZmt3bjcwazAKCy9nLzF0cXQ5Nms2CgwvZy8xcHR4c3lfd3AKDS9nLzExYmNjZDBjMjgKCy9nLzF0ZjNiMXZ5CgsvZy8xdGRxNWs3ZAoNL2cvMTFjNnlfenN4MwoLL2cvMXRkMTdkNTgKCy9nLzF0ZmdueXp2CgwvZy8xMmhxbGZsbXIKDS9nLzExYnp4MHhqa2YSBBICCAESBAoCCAGaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwjO-r3rs_qCAxW7UKQEHYSmAjoQjGp6BAgdEAE&scp=ChVnY2lkOm1hcmtldGluZ19hZ2VuY3kSUBISCdv1JlJMTXpIEapr_gQ4FL7ZGhIJoceAoT2ye0gREDRt7Z75DAQiDk1hbmNoZXN0ZXIsIFVLKhQNti3UHxV3CKH-HXdB6h8lgGu4_jAAGg5tZWRpYSBhZ2VuY2llcyIZbWFuY2hlc3RlciBtZWRpYSBhZ2VuY2llcyoQTWFya2V0aW5nIGFnZW5jeQ%3D%3D"; // Replace with your desired URL
const city = "Manchester"; // Replace with the desired city
const country = "UK"; // Replace with the desired country
const excelFileName = `${city}.xlsx`;
const deep = 15; // Max Number of Google Local Services Pages Fetched

displayMediaAgenciesAndEmails(baseUrl, excelFileName, city, country);

let stars = (num) => ` ${"*".repeat(num)} `;

// Function to extract website URLs from a given webpage

async function extractWebsiteUrls(baseUrl) {
	let lastScrapedPage;
	return await scrapePages(baseUrl, deep);

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

async function extractEmail(url, urlIndex) {
	const contactPageVariations = [
		"/contact",
		"/contact-us",
		"/contactus",
		"/get-in-touch",
		"/about-us/contact",
		"/about/contact",
		"/aboutus/contact",
		"/info/contact",
		"/support",
		"/support/contact",
		"/help",
		"/help/contact",
		"/customer-service",
		"/customer-service/contact",
		/* add more variations as needed */
	];

	try {
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

		console.log(
			stars(2),
			`Start Extracting Emails From URL N: ${urlIndex} of ${websiteUrls.length}`,
			stars(2)
		);

		await page.goto(url, { waitUntil: "domcontentloaded" });

		const getEmailAddresses = async () => {
			return await page.$$eval('a[href^="mailto:"]', (links) =>
				links.map((link) => link.getAttribute("href").replace("mailto:", ""))
			);
		};

		const emailAddresses = await getEmailAddresses();
		const uniqueEmailAddresses = Array.from(new Set(emailAddresses));

		if (uniqueEmailAddresses.length === 0) {
			// If no email found, try variations of contact pages using Puppeteer
			for (const contactVariation of contactPageVariations) {
				const contactPageUrl = url + contactVariation;
				await page.goto(contactPageUrl, { waitUntil: "domcontentloaded" });

				const contactEmailAddresses = await getEmailAddresses();
				const uniqueContactEmailAddresses = Array.from(
					new Set(contactEmailAddresses)
				);

				if (uniqueContactEmailAddresses.length > 0) {
					console.log("Contact Returning the first email found");
					console.log(uniqueContactEmailAddresses);
					await browser.close();
					return uniqueContactEmailAddresses; // Return the first email found
				}
			}
		}

		await browser.close();
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

let websiteUrls;

async function displayMediaAgenciesAndEmails(
	baseUrl,
	excelFileName,
	city,
	country
) {
	// Extract and display website URLs
	websiteUrls = await extractWebsiteUrls(baseUrl);

	// Extract and display emails from each website URL
	const data = [];
	console.log(
		stars(10),
		"Start Extracting Emails + Names: Fetching For Media Agencies Emails + Names",
		stars(10)
	);
	for (const url of websiteUrls) {
		const emails = await extractEmail(url, websiteUrls.indexOf(url));
		const agencyName = extractAgencyName(url); // Extract agency name from the URL (for demonstration purposes)

		// Push data to the array
		if (emails.length > 0) {
			data.push({ agencyName, url, city, country, emails: emails.join(", ") });
		}
	}
	console.log(
		stars(5),
		"Number Of Emails Found:",
		data.length,
		"Emails",
		stars(5)
	);
	console.log(stars(10), "Start Exportation to Excel File", stars(10));
	// Export data to an Excel file
	await exportToExcel(data, excelFileName);
}

// Function to export data to an Excel file

async function exportToExcel(data, excelFileName) {
	try {
		const headers = Object.keys(data[0]); // Assuming all objects have the same keys

		const worksheet = xlsx.utils.json_to_sheet(data, { header: headers });
		const workbook = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(workbook, worksheet, "Media Agencies");

		// Specify the subfolder path
		const subfolderPath = "Results";

		// Join the subfolder path with the original file name
		const fullPath = path.join(subfolderPath, excelFileName);

		// Write the Excel workbook to the file in the subfolder
		xlsx.writeFile(workbook, fullPath);

		console.log(stars(5), `Data exported to ${fullPath}`, stars(5));
	} catch (error) {
		console.error("Error exporting data to Excel file:", error.message);
	}
}
