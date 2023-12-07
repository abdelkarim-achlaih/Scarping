const xlsx = require("xlsx");
const puppeteer = require("puppeteer");
const path = require("path");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaM5A7UIxgu6bF7XsRGcSSd9GF2XmhBAhyyFuBuWaVGlujFLFHH2pHp8O14d8nrn1ixl3dYv5e3QAuSeHFqx4kyCYj4ms02OjKya_9NXsgc1OKYiDDV-g8HVPtVPJ4o8TdpvHLIq&hl=en-MA&gl=ma&cs=1&ssta=1&q=london%20media%20agencies&oq=london%20media%20agencies&slp=MgA6HENoTUk3YnVjaE9EOGdnTVZXSVZvQ1IzNmlRczNSAggCYACSAaMCCgwvZy8xcTZqY201eTUKDS9nLzExZjhoc3prdG0KCy9nLzF0cDI2azE1CgwvZy8xcHR2dmowY2IKDS9nLzExYnRtOXBfdGwKDC9nLzFoZjI2ZHlxZgoLL2cvMXRycHE4Y2cKDS9nLzExdHNkOXg5ZGIKDS9nLzExczdmdzdwM3MKCy9nLzF0ZzZrMGJmCgsvZy8xdGdfOHpreAoLL2cvMXY4MzBsamcKCy9nLzF0aGs4Nmx2CgsvZy8xdGRrbHBfYgoNL2cvMTFiel96c3QwMwoLL2cvMXRscXBnYjEKCy9nLzF0Y3hwNGtnCg0vZy8xMWI4YzNjOXYyCg0vZy8xMWI3bHBoc2x6Cg0vZy8xMWZqNnk5cXc2EgQSAggBEgQKAggBmgEGCgIXGRAA&src=2&serdesk=1&sa=X&sqi=2&ved=2ahUKEwiwhpeE4PyCAxU2RaQEHYigCXgQjGp6BAhcEAE&scp=ChVnY2lkOm1hcmtldGluZ19hZ2VuY3kSTBISCXXeIa8LoNhHEZkq1d1aOpZSGhIJb-IaoQug2EcRi-m4hONz8S8iCkxvbmRvbiwgVUsqFA05uKAeFcVeyv8d6JLMHiXWnxYAMAAaDm1lZGlhIGFnZW5jaWVzIhVsb25kb24gbWVkaWEgYWdlbmNpZXMqEE1hcmtldGluZyBhZ2VuY3k%3D"; // Replace with your desired URL
const city = "London"; // Replace with the desired city
const country = "UK"; // Replace with the desired country
const excelFileName = `${city}.xlsx`;
const deep = 1; // Max Number of Google Local Services Pages Fetched

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

async function extractEmail(url, urlIndex, page) {
	const contactPageVariations = [
		"/contact",
		"/contact-us",
		"/contactus",
		// "/get-in-touch",
		// "/about-us/contact",
		// "/about/contact",
		// "/aboutus/contact",
		// "/info/contact",
		// "/support",
		// "/support/contact",
		// "/help",
		// "/help/contact",
		// "/customer-service",
		// "/customer-service/contact",
		/* add more variations as needed */
	];

	try {
		console.log(
			stars(2),
			`Start Extracting Emails From URL N: ${urlIndex} of ${websiteUrls.length}`,
			stars(2)
		);

		const getEmailAddresses = async () => {
			const mailtoLinks = await page.$$eval('a[href^="mailto:"]', (links) =>
				links.map((link) => link.getAttribute("href").replace("mailto:", ""))
			);

			if (mailtoLinks.length > 0) {
				return mailtoLinks;
			} else {
				// If no mailto links are found, search for email addresses in the page's inner text
				const pageText = await page.evaluate(async () => {
					await new Promise((resolve) => {
						if (document.body) {
							resolve();
						} else {
							document.addEventListener("DOMContentLoaded", () => {
								resolve();
							});
						}
					});

					return document.body.innerText;
				});

				const emailRegex =
					/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
				return pageText.match(emailRegex) || [];
			}
		};

		async function navigateWithRetry(page, url, maxRetries = 5) {
			let retries = 0;
			let delayBeforeRetry = 1000;

			while (retries < maxRetries) {
				try {
					await page.goto(url, { waitUntil: "domcontentloaded" });
					return true; // Break out of the loop if navigation is successful
				} catch (error) {
					console.error(`Error navigating to ${url}:`, error.message);
					retries++;
					if (retries < maxRetries) {
						// console.log(`Retrying in ${delayBeforeRetry}ms...`);
						await page.waitForTimeout(delayBeforeRetry);
					}
				}
			}

			console.error(
				`Failed to navigate to ${url} after ${maxRetries} retries.`
			);
			return false;
		}

		const success = await navigateWithRetry(page, url);

		if (success) {
			// Perform other actions after successful navigation

			const emailAddresses = await getEmailAddresses();
			const uniqueEmailAddresses = Array.from(new Set(emailAddresses));

			if (uniqueEmailAddresses.length === 0) {
				// If no email found, try variations of contact pages using Puppeteer
				for (const contactVariation of contactPageVariations) {
					const contactPageUrl = url.endsWith("/")
						? url.slice(0, -1) + contactVariation
						: url + contactVariation;
					console.log(contactPageUrl);
					await page.goto(contactPageUrl, { waitUntil: "domcontentloaded" });

					const contactEmailAddresses = await getEmailAddresses();
					const uniqueContactEmailAddresses = Array.from(
						new Set(contactEmailAddresses)
					);

					if (uniqueContactEmailAddresses.length > 0) {
						console.log("Contact Returning the first email found");
						console.log(uniqueContactEmailAddresses);
						return uniqueContactEmailAddresses; // Return the first email found
					}
				}
			}

			return uniqueEmailAddresses;
		}
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
			"--blink-settings=imagesEnabled=false",
		],
	});
	const page = await browser.newPage();
	for (const url of websiteUrls) {
		const emails = await extractEmail(url, websiteUrls.indexOf(url), page);
		const agencyName = extractAgencyName(url); // Extract agency name from the URL (for demonstration purposes)

		// Push data to the array
		if (emails.length > 0) {
			data.push({ agencyName, url, city, country, emails: emails.join(", ") });
		}
	}
	await browser.close();
	console.log(stars(5), "Number Of Agencies Found:", data.length, stars(5));
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
