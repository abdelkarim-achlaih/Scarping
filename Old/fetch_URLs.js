const puppeteer = require("puppeteer");

const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaO1pBbry6LVZRtn4BDAfP1wJrRpH5yeiurgbkkiCalXw3fNUIayBY6HNvzax_fvJSSgwEPnH77kaHl0Jgrl0QjsY74aYvy-a4g6p9auEK-4NiTDUQ50TjhfM0GgEUrLR9QXyq1koL3dm90DExCH2k1hXE3rtg%3D%3D&hl=en-MA&gl=ma&cs=1&ssta=1&q=media%20agency%20in%20doha&oq=media%20agency%20in%20doha&slp=MgA6HENoTUl6N2JxOWQzdWdnTVY3cEpvQ1IyNzZ3WnVSAggCYACSAbQCCg0vZy8xMWgwMGtwMGpwCg0vZy8xMWJ5X2xiYzFnCg0vZy8xMWdqdDVrNXlfCg0vZy8xMWY3YjRiN24xCg0vZy8xMWI2Y21iMzBoCg0vZy8xMWI2Zzg4Z3IxCg0vZy8xMWdzbV9fN2NfCg0vZy8xMWc2eHF4eV9sCg0vZy8xMWZsczFucmhoCg0vZy8xMWNzNXdud19qCg0vZy8xMWo0MDN3bDBtCgsvZy8xdnNwcHp4MgoNL2cvMTFndHpiMDNsbQoNL2cvMTFoZGxxbjNqOAoML2cvMTJxZjhyeHoyCg0vZy8xMWZucjd2Zmp0Cg0vZy8xMXM4Z3hxa2dkCg0vZy8xMXZkdGw0djJnCgwvZy8xMTl2cTdqX24KDS9nLzExazQ4bDg2M2ISBBICCAESBAoCCAGaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwjX9eT13e6CAxVNVaQEHatNDqAQjGp6BAgbEAE&scp=ChVnY2lkOm1hcmtldGluZ19hZ2VuY3kSTRISCX_o3P80xUU-EbHUz3ifMdlEGhIJ-1Qr6CHDRT4RTArqZp7mbGkiC0RvaGEsIFFhdGFyKhQNX2r-DhVBY6IeHdemJQ8lfNPFHjAAGgxtZWRpYSBhZ2VuY3kiFG1lZGlhIGFnZW5jeSBpbiBkb2hhKhBNYXJrZXRpbmcgYWdlbmN5";

scrapePages(baseUrl, 20);
let stars = (num) => ` ${"*".repeat(num)} `;

let lastScrapedPage;
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
