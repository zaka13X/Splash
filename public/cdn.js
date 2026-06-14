"use strict";

// ============================================================================
// 1. DOM ELEMENT REFERENCES
// ============================================================================
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

// Quiet logger function for console observation
function logDebug(msg) {
	console.log(`[Proxy Log] ${msg}`);
}

// ============================================================================
// 2. EMBEDDED UTILITY & FALLBACK FUNCTIONS
// ============================================================================

/**
 * Registers the Scramjet local proxy service worker layer.
 * Updates the placeholder URL below to point to your hosted service worker.
 */
async function registerSW() {
	if ("serviceWorker" in navigator) {
		// CDN PLACEHOLDER: point this path to where your proxy sw.js lives on your server
		const swPath = "/PLACEHOLDER-YOUR-LOCAL-SW.js";
		return await navigator.serviceWorker.register(swPath, {
			scope: "/scram/"
		});
	}
	throw new Error("Service workers are not supported by this browser.");
}

/**
 * Default search routing engine fallback if window.search isn't provided via CDN.
 * Formats user input strings into clear absolute paths or search queries.
 */
function fallbackSearchUtility(input, templateEngine) {
	let cleanInput = input.trim();
	if (!cleanInput) return "";

	// If it looks like a clean URL link, append protocol layer
	if (!cleanInput.startsWith("http://") && !cleanInput.startsWith("https://")) {
		if (cleanInput.includes(".") && !cleanInput.includes(" ")) {
			return "https://" + cleanInput;
		} else {
			// Fallback querying engine template execution
			const engine = templateEngine || "https://google.com";
			return engine + encodeURIComponent(cleanInput);
		}
	}
	return cleanInput;
}

// ============================================================================
// 3. ENGINE INITIALIZATION (SCRAMJET & BAREMUX)
// ============================================================================

let ScramjetController;
try {
	// Attempt resolving via the core TitaniumNetwork global module load trigger
	if (typeof $scramjetLoadController === "function") {
		const loaded = $scramjetLoadController();
		ScramjetController = loaded.ScramjetController;
	} else if (typeof window.ScramjetController !== "undefined") {
		ScramjetController = window.ScramjetController;
	} else {
		throw new Error("$scramjetLoadController hook missing on window scope.");
	}
} catch (initError) {
	console.error("Critical: Scramjet core setup scripts failed to load from CDN context.", initError);
}

// CDN PLACEHOLDER: Update these strings to match the chosen release version paths
const scramjet = ScramjetController ? new ScramjetController({
	files: {
		wasm: "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/scram/scramjet.all.js",
		all: "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/scram/scramjet.wasm.wasm",
		sync: "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/scram/scramjet.sync.js",
	},
}) : null;

if (scramjet) {
	scramjet.init();
}

// Initialize BareMux network multiplexer using dedicated multi-threaded worker pipeline
let connection;
try {
	if (typeof BareMux !== "undefined") {
		// CDN PLACEHOLDER: Links the main script context to the parallel CDN pipeline file
		const workerUrl = "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/baremux/worker.js";
		connection = new BareMux.BareMuxConnection(workerUrl, "service-worker");
	} else {
		console.warn("BareMux module layer absent. Degrading direct routing operations.");
	}
} catch (e) {
	try {
		const fallbackWorkerUrl = "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/baremux/worker.js";
		connection = new BareMux.BareMuxConnection(fallbackWorkerUrl);
	} catch (innerErr) {
		console.error("BareMux connection initialization failed completely:", innerErr);
	}
}

// ============================================================================
// 4. UNIFIED SUBMIT ARCHITECTURE
// ============================================================================
if (form) {
	form.addEventListener("submit", async (event) => {
		// Terminate default reload loops safely
		event.preventDefault();

		if (!scramjet) {
			if (error) error.textContent = "Proxy engine initialization error.";
			return;
		}

		// 4a. Fire worker engine layer registrations
		try {
			await registerSW();
		} catch (err) {
			console.warn("Service worker initialization bypassed:", err);
		}

		// 4b. Parse out user addresses or target search engine configurations
		let rawAddress = address ? address.value : "";
		const selectedEngine = searchEngine ? searchEngine.value : "https://google.com";
		let targetUrl = "";

		try {
			// Leverage existing CDN layout modules if accessible, else fall back to local module logic
			if (typeof window.search === "function") {
				targetUrl = window.search(rawAddress, selectedEngine);
			} else {
				targetUrl = fallbackSearchUtility(rawAddress, selectedEngine);
			}
		} catch (searchError) {
			console.error("Input resolution crash, running baseline string fallback parsing:", searchError);
			targetUrl = fallbackSearchUtility(rawAddress, "https://google.com");
		}

		// 4c. Establish connection across unblocked fast secure websocket transport pipeline
		if (connection) {
			// PLACEHOLDER: Update this endpoint if your current network environment blocks mercurywork.shop
			let wispUrl = "wss://wisp.mercurywork.shop/";
			try {
				// CDN PLACEHOLDER: Point explicitly to your active production libcurl CDN resource script
				const transportPath = "https://cdn.jsdelivr.net/gh/zaka13X/WaterProxy/libcurl/index.mjs";
				await connection.setTransport(transportPath, [
					{ websocket: wispUrl },
				]);
			} catch (transportError) {
				console.error("Network transport layer connection completely failed:", transportError);
			}
		}

		// 4d. Reconstruct dynamic proxy viewport container within user document body
		try {
			const oldFrame = document.getElementById("sj-frame");
			if (oldFrame) oldFrame.remove();

			const frame = scramjet.createFrame();
			frame.frame.id = "sj-frame";
			frame.frame.style = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;";
			
			document.body.appendChild(frame.frame);
			frame.go(targetUrl);
			logDebug(`Successfully launched target proxy viewport path: ${targetUrl}`);
		} catch (frameError) {
			if (error && errorCode) {
				error.textContent = "Failed to launch unblocked sandbox viewframe.";
				errorCode.textContent = frameError.toString();
			}
			console.error("Viewport presentation compilation error inside frame handler:", frameError);
		}
	});
}

logDebug("Production script initialized successfully.");
