const xlsx = require("xlsx");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaMkeDDIPmb0MV-2tsryOGbLbawRNaR2QujjmwrCN-DC6axPANtqPug9p_MmLv0HSW_KBliuoTO2FUkpNgCfBt9r9mpELU3je8f9-w0rZQ9J7TFvbMo%3D&hl=en-MA&gl=ma&cs=1&ssta=1&q=manchester%20media%20agencies&oq=manchester%20media%20agencies&slp=MgA6HENoTUk4TUcxZ3BYOWdnTVZZSVZvQ1IyT2dndUpSAggCYACSAasCCg0vZy8xMWZnNjBkXzczCg0vZy8xMWowdzlnMjh3CgwvZy8xaGRfdjVyNzkKDS9nLzExaDhqenhzbGgKDS9nLzExY20weDJjdGsKDS9nLzExYzVidDBqanIKDS9nLzExYndfNTZxajAKDS9nLzExZHliZmhyX20KDS9nLzExYzZ5ejl6bngKDS9nLzExZmt3bjcwazAKCy9nLzF0cXQ5Nms2CgwvZy8xcHR4c3lfd3AKDS9nLzExYmNjZDBjMjgKCy9nLzF0ZjNiMXZ5CgsvZy8xdGRxNWs3ZAoNL2cvMTFiNzVkc3o4OQoNL2cvMTFjNnlfenN4MwoLL2cvMXRkMTdkNTgKCy9nLzF0ZmdueXp2CgwvZy8xMmhxbGZsbXISBBICCAESBAoCCAGaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwiHyq-Clf2CAxXrUaQEHSKEBdkQjGp6BAggEAE&scp=ChVnY2lkOm1hcmtldGluZ19hZ2VuY3kSUBISCdv1JlJMTXpIEapr_gQ4FL7ZGhIJoceAoT2ye0gREDRt7Z75DAQiDk1hbmNoZXN0ZXIsIFVLKhQNti3UHxV3CKH-HXdB6h8lgGu4_jAAGg5tZWRpYSBhZ2VuY2llcyIZbWFuY2hlc3RlciBtZWRpYSBhZ2VuY2llcyoQTWFya2V0aW5nIGFnZW5jeQ%3D%3D"; // Replace with your desired URL
const city = "Manchester"; // Replace with the desired city
const country = "UK"; // Replace with the desired country
const deep = 1; // Max Number of Google Local Services Pages Fetched
const agenciesPerPage = 4; // Max Number of Agencies per excel file

displayMediaAgenciesAndEmails(baseUrl, city, country);

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
					// console.log(contactPageUrl);
					await page.goto(contactPageUrl, { waitUntil: "domcontentloaded" });

					const contactEmailAddresses = await getEmailAddresses();
					const uniqueContactEmailAddresses = Array.from(
						new Set(contactEmailAddresses)
					);

					if (uniqueContactEmailAddresses.length > 0) {
						console.log(`Email returned from ${contactVariation}`);
						// console.log(uniqueContactEmailAddresses);
						return uniqueContactEmailAddresses; // Return the first email found
					}
				}
			}

			return uniqueEmailAddresses;
		} else {
			return [];
		}
	} catch (error) {
		console.error(`Error extracting email from ${url}:`, error.message);
		return [];
	}
}

// Function to extract agency name from the URL

function extractAgencyName(email) {
	// Extract the agency name from the email template after the "@"
	const agencyWithTLD = email.split("@")[1];

	// Remove the TLD by getting the substring before the last "."
	const agencyName = agencyWithTLD
		? agencyWithTLD.substring(0, agencyWithTLD.lastIndexOf("."))
		: "Unknown";

	return agencyName || "Unknown";
}

let websiteUrls;

async function createSubfolder() {
	// Set the path to the "Results" folder
	const resultsFolder = path.join(__dirname, "Results");

	// Create the full path for the country folder
	const countryFolderPath = path.join(resultsFolder, country);

	// Check if the country folder already exists
	if (!fs.existsSync(countryFolderPath)) {
		// Create the country folder
		fs.mkdirSync(countryFolderPath, { recursive: true });
		console.log(`Folder '${country}' created in the 'Results' folder.`);
	} else {
		console.log(`Folder '${country}' already exists in the 'Results' folder.`);
	}

	// Create the full path for the subfolder (city)
	const subfolderPath = path.join(countryFolderPath, city);

	// Check if the subfolder already exists
	if (!fs.existsSync(subfolderPath)) {
		// Create the subfolder
		fs.mkdirSync(subfolderPath, { recursive: true });
		console.log(`Subfolder '${city}' created in the '${country}' folder.`);
	} else {
		console.log(
			`Subfolder '${city}' already exists in the '${country}' folder.`
		);
	}
}

async function displayMediaAgenciesAndEmails(baseUrl, city, country) {
	// Call the function to create the subfolder
	await createSubfolder(city);

	// Rest of your existing code...
	// Extract and display website URLs
	websiteUrls = await extractWebsiteUrls(baseUrl);

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

	const foundAgencies = [];
	let exportedFiles = 0;
	for (const url of websiteUrls) {
		const emails = await extractEmail(url, websiteUrls.indexOf(url), page);

		// Push data to the array
		if (emails.length > 0) {
			const agencyName = extractAgencyName(emails[0]); // Extract agency name from the URL
			foundAgencies.push({
				agencyName,
				url,
				city,
				country,
				emails: emails.join(", "),
			});

			// Check if the batch size is reached
			if (foundAgencies.length >= agenciesPerPage) {
				// Export data to an Excel file with a unique name
				const batchNumber = exportedFiles + 1;
				exportedFiles++;
				const excelFilePath = path.join(
					__dirname,
					"Results",
					country,
					city,
					`${city}-${batchNumber}.xlsx`
				);
				await exportToExcel(foundAgencies, excelFilePath);
				// Reset the array for the next batch
				foundAgencies.length = 0;
			}
		}
	}

	// Export any remaining agencies to Excel
	if (foundAgencies.length > 0) {
		const batchNumber = exportedFiles + 1;
		exportedFiles++;
		const excelFilePath = path.join(
			__dirname,
			"Results",
			country,
			city,
			`${city}-${batchNumber}.xlsx`
		);
		await exportToExcel(foundAgencies, excelFilePath);
	}

	await browser.close();
	console.log(stars(10), "Exportation to Excel Files Complete", stars(10));
}

// Function to export data to an Excel file

async function exportToExcel(data, fullPath) {
	try {
		const headers = Object.keys(data[0]); // Assuming all objects have the same keys

		const worksheet = xlsx.utils.json_to_sheet(data, { header: headers });
		const workbook = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(workbook, worksheet, "Media Agencies");

		// Write the Excel workbook to the file in the subfolder
		xlsx.writeFile(workbook, fullPath);

		console.log(stars(5), `Data exported to ${fullPath}`, stars(5));
	} catch (error) {
		console.error("Error exporting data to Excel file:", error.message);
	}
}

