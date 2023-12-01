const puppeteer = require("puppeteer");

async function getLinks(page) {
	try {
		// Extract href attributes from a elements with aria-label="Website"
		const websiteUrls = await page.$$eval(
			'a[aria-label="Website"]',
			(elements) => {
				return elements.map((element) => element.href);
			}
		);

		// console.log("Website URLs:", websiteUrls);
		return websiteUrls;
	} catch (error) {
		console.error("Error extracting website URLs:", error.message);
		return [];
	}
}

async function navigateToNextPage(page) {
	// Wait for the "Next" button to be present and visible in the DOM
	await page.waitForSelector('button[aria-label="Next"]', {
		timeout: 60000,
		waitUntil: "visible",
	});

	// Introduce a delay or use waitForTimeout before clicking the button
	await page.waitForTimeout(1000); // Adjust the delay as needed

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
}

async function scrapePages(baseUrl, maxPages = 3) {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();

	try {
		// Navigate to the initial URL
		await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

		// Wait for a specific content element to be present on the page
		await page.waitForSelector(`button[aria-label="Next"]`, {
			timeout: 60000,
		});

		for (let pageCounter = 0; pageCounter < maxPages; pageCounter++) {
			// Get links from the current page
			const websiteUrls = await getLinks(page);

			// Do something with the extracted website URLs
			console.log(`Page ${pageCounter + 1} - Website URLs:`, websiteUrls);

			// Navigate to the next page
			await navigateToNextPage(page);
		}
	} catch (error) {
		console.error("Error during page navigation:", error);
	} finally {
		// Close the browser
		await browser.close();
	}
}

// Example usage
const baseUrl =
	"https://www.google.com/localservices/prolist?g2lbs=ANTchaOMVUIU-7ZEbBNLJMvFxZbtquZo3HtWtQmQHSQj52YYdRb8prc2AmF_7zLpuzdk0njnH3nS1S5s0JeO3jyPfcAEnH7uU-LEjFcxfF7NCZKMaNVslMRJHhZ7E-aFZb4DDXJnjCH4OCFKFV4-HysEqCQVxYqkMg%3D%3D&hl=en-MA&gl=ma&cs=1&ssta=1&q=media%20agency%20in%20doha&oq=media%20agency%20in%20doha&slp=MgA6HENoTUlfLU9QdGNUdWdnTVZWNVhWQ2gxOE5nUE5SAggCYACSAbQCCg0vZy8xMWgwMGtwMGpwCg0vZy8xMWJ5X2xiYzFnCg0vZy8xMWdqdDVrNXlfCg0vZy8xMWY3YjRiN24xCg0vZy8xMWI2Y21iMzBoCg0vZy8xMWI2Zzg4Z3IxCg0vZy8xMWdzbV9fN2NfCg0vZy8xMWc2eHF4eV9sCg0vZy8xMWZsczFucmhoCg0vZy8xMWNzNXdud19qCg0vZy8xMWo0MDN3bDBtCgsvZy8xdnNwcHp4MgoNL2cvMTFndHpiMDNsbQoNL2cvMTFoZGxxbjNqOAoML2cvMTJxZjhyeHoyCg0vZy8xMWZucjd2Zmp0Cg0vZy8xMXM4Z3hxa2dkCg0vZy8xMXZkdGw0djJnCgwvZy8xMTl2cTdqX24KDS9nLzExazQ4bDg2M2ISBBICCAESBAoCCAGaAQYKAhcZEAA%3D&src=2&serdesk=1&sa=X&ved=2ahUKEwjM3Im1xO6CAxUsRKQEHWcmAOcQjGp6BAghEAE&scp=Ch1nY2lkOmV2ZW50X21hbmFnZW1lbnRfY29tcGFueRJNEhIJf-jc_zTFRT4RsdTPeJ8x2UQaEgn7VCvoIcNFPhFMCupmnuZsaSILRG9oYSwgUWF0YXIqFA1fav4OFUFjoh4d16YlDyV808UeMAAaDG1lZGlhIGFnZW5jeSIUbWVkaWEgYWdlbmN5IGluIGRvaGEqGEV2ZW50IG1hbmFnZW1lbnQgY29tcGFueQ%3D%3D";
scrapePages(baseUrl, 20); // Scrape the first 3 pages
