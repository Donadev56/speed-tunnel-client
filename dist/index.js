#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from "dotenv";
import http from "http";
import logger from "./logger/logger.js";
import { io } from "socket.io-client";
import { GenerateRadomLetters } from "./utils/subdomain.js";
import { Command } from "commander";
import WebSocket from "ws";
// Configure environment variables from .env file
dotenv.config();
// start the commander program
const program = new Command();
// Retrieve configuration from environment variables with default values
const PORT = process.env.PORT || 5003;
const SERVER_IP = process.env.SERVER_IP || "92.113.27.204";
const DOMAIN = process.env.DOMAIN || "opennode.tech";
// Initialize prompt for user input with support for SIGINT (Ctrl+C)
// Variables to store subdomain name and local server port
let subdomainName;
let localPORT;
let socketServer;
let hasRegistered;
let ws;
let WsURL;
// Define the CLI version
program
    .version("1.0.0")
    .description('A magic  🎩✨ tool to publish local servers on the internet.');
// Construct the main server URL for Socket.IO connection
const mainServer = `http://${SERVER_IP}:${PORT}/tunnel`;
// Initialize Socket.IO client and connect to the main server
socketServer = io(mainServer);
/**
 * Event handler for successful connection to the main server.
 * Handles initial registration or reconnection logic.
 */
const register = () => __awaiter(void 0, void 0, void 0, function* () {
    // Log the attempt to connect to the main server
    logger.info(`🌐 Connecting to main server at ${mainServer}`);
    try {
        if (isNaN(localPORT) || localPORT <= 0 || localPORT > 65535) {
            logger.error("❌ Invalid port number provided. Please provide a valid port.");
            process.exit(1);
        }
        if (!hasRegistered) {
            const connectionData = {
                type: "REGISTRATION",
                targetPort: localPORT,
                subdomain: subdomainName,
            };
            // Check if the socket is connected before emitting
            if (socketServer.connected) {
                socketServer.emit("registration", connectionData);
                logger.info(`📤 Registration data sent to the main server: ${JSON.stringify(connectionData)}`);
            }
            else {
                // Listen for the connect event to register once connected
                socketServer.once("connect", () => {
                    socketServer.emit("registration", connectionData);
                    logger.info(`📤 Registration data sent after connect event: ${JSON.stringify(connectionData)}`);
                });
                socketServer.connect();
            }
        }
        else {
            reconnect();
        }
    }
    catch (error) {
        logger.error("An error occurred during registration");
        logger.error(JSON.stringify(error));
    }
});
const initData = (port, subdomain) => {
    const subdomainNamePrompt = subdomain;
    const portPrompt = port;
    const uniqueLetters = GenerateRadomLetters();
    const newSubdomain = `${subdomainNamePrompt.trim()}-${uniqueLetters}`;
    logger.warn("Starting the tunnel, click on CTRL + C or CMD + C to exit");
    logger.info(`🔗 Your website will be available at: ${newSubdomain}.${DOMAIN}`);
    subdomainName = newSubdomain;
    localPORT = Number(portPrompt);
};
// Define the `start` command with `--port` and `--subdomain` options
program
    .command("start")
    .description("Start the tunnel client with specified port and subdomain")
    .option("-p, --port <port>", "Port number to expose")
    .option("-s, --subdomain <subdomain>", "Subdomain for the tunnel")
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    const port = parseInt(options.port, 10);
    const subdomain = options.subdomain;
    // Check that both port and subdomain are provided
    if (isNaN(port) || !subdomain) {
        console.error("Error: Please provide both a valid port and subdomain.");
        process.exit(1);
    }
    console.log(`Starting tunnel on port ${port} with subdomain ${subdomain}`);
    yield initData(port, subdomain); // Call the register function with parsed options
}));
program.parse(process.argv);
socketServer.on("connect", () => {
    // Initial connection flow when subdomainName is not yet set
    logger.info("✅ Successfully connected to the main server");
    logger.info("Welcome to Speed-Tunnel 👋");
    if (localPORT && subdomainName) {
        register();
    }
});
/**
 * Handles the reconnection logic by emitting a Reconnection event
 * with the existing connection data.
 */
const reconnect = () => {
    try {
        logger.warn("The connexion was lost , trying to reconnect");
        logger.warn(`⚠️ 🚸  Warning:
         During the reconnection your subdomain name will change ,
         to make sure registration will be done successfully ! `);
        // Validate the local port number before attempting reconnection
        if (isNaN(localPORT) || localPORT <= 0 || localPORT > 65535) {
            logger.error("❌ Invalid port number provided. Please provide a valid port.");
            process.exit(1); // Exit the application if port is invalid
        }
        // Prepare the reconnection data
        const connectionData = {
            type: "REGISTRATION",
            targetPort: localPORT,
            subdomain: subdomainName,
        };
        logger.warn("Start reconnecting...");
        // Emit the Reconnection event to the main server with connection data
        socketServer.emit("Reconnection", connectionData);
        logger.info(`📤 Re-registration data sent to the main server: ${JSON.stringify(connectionData)}`);
    }
    catch (error) {
        // Log any errors that occur during the reconnection process
        logger.error(`⚠️ Error during reconnection: ${error}`);
    }
};
/**
 * Event handler for receiving registration results from the main server.
 * Logs the outcome of the registration process.
 */
socketServer.on("registrationResult", (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { success, msg } = data;
        if (success) {
            logger.info(`🎉 Registration successful: ${msg}`);
            hasRegistered = true;
        }
        else {
            logger.error(`❌ Registration failed: ${msg}`);
            logger.warn("Trying to reconnect again ....");
            reconnect();
        }
    }
    catch (error) {
        // Log any errors that occur while processing the registration result
        logger.error(`⚠️ Error processing registration result: ${error}`);
    }
}));
/**
 * Event handler for receiving HTTP requests from the main server.
 * Forwards the request to the local Fastify server and sends back the response.
 */
socketServer.on("httpRequest", (requestData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId, connection, request } = requestData;
        // Log the receipt of the HTTP request from the server
        logger.info(`📥 Received HTTP request [ID: ${requestId}] from server, forwarding to Fastify server at localhost:${localPORT}`);
        // Forward the incoming request to the local Fastify server and await the response
        let response;
        const isWebSocket = isWebSocketRequest(request.headers);
        if (isWebSocket) {
            logger.info(JSON.stringify(request.headers));
            logger.info("the connection is a websocket connection");
        }
        if (isWebSocket) {
            console.log(`Socket headers : ${request.headers}`);
            // if the connection is a websocket connection
            logger.warn("The headers required websocket connexion , processing...");
            yield createSocketconnection(request, localPORT);
            return;
        }
        response = yield forwardRequestToLocalFastify(request, localPORT);
        if (isWebSocket && response) {
            logger.warn("The websocket response is ");
            console.info(response);
        }
        // init the response
        let responseData;
        // Prepare the response data to send back to the main server
        // if it's an http request
        responseData = {
            requestId: requestId,
            type: "HTTP_RES",
            reply: response.responseData,
            headers: response.responseHeaders,
            statusCode: response.responseStatusCode,
            statusMessage: response.responseStatusMessage,
        };
        console.log("response status : ", response.responseStatusCode);
        // Emit the response back to the main server with the corresponding request ID
        socketServer.emit("RequestResponse", responseData);
        logger.info(`📤 Response for request ID ${requestId} sent to the main server`);
        logger.debug(`Response details: ${JSON.stringify(responseData, null, 2)}`);
    }
    catch (error) {
        // Log any errors that occur while handling the HTTP request
        logger.error(`⚠️ Error handling httpRequest: ${error}`);
    }
}));
const sendWebsocketResponse = (response) => {
    try {
        logger.info("sending message to the main server from the websocket....");
        const socketData = {
            subdomain: subdomainName,
            message: response
        };
        socketServer.emit("WebsocketResponse", socketData);
        logger.info("Message sent to the main server ✅");
    }
    catch (error) {
        logger.error(`An error occured while sending the response ${error}`);
    }
};
/**
 * Forwards an HTTP request to the local Fastify server and retrieves the response.
 *
 * @param {IncomingMessage} request - The incoming HTTP request data.
 * @param {number} port - The local port where the Fastify server is running.
 * @returns {Promise<LocalHttpResponse>} - The response received from the Fastify server.
 *
 */
const forwardRequestToLocalFastify = (request, port) => {
    return new Promise((resolve, reject) => {
        // Define the options for the HTTP request to the local Fastify server
        const options = {
            hostname: "localhost",
            port: port,
            path: request.url || "/",
            method: request.method,
            headers: request.headers,
            timeout: 5000, // Timeout set to 5000ms
        };
        isWebSocketRequest(options.headers) ? logger.info(`HANDLING WEBSOCKET CONNECTION`) : "";
        // Log the forwarding of the HTTP request with the specified options
        logger.info(`🔄 Forwarding HTTP request to localhost:${port}`);
        // Initiate the HTTP request to the local Fastify server
        const req = http.request(options, (res) => {
            let responseData = "";
            const responseHeaders = res.headers;
            const responseStatusCode = res.statusCode || 0;
            const responseStatusMessage = res.statusMessage || "";
            // Collect data chunks from the response
            res.on("data", (chunk) => {
                responseData += chunk;
            });
            // Resolve the promise once the response has ended
            res.on("end", () => {
                const response = {
                    responseHeaders,
                    responseStatusMessage,
                    responseStatusCode,
                    responseData,
                };
                isWebSocketRequest(options.headers) ? logger.info(`RESPONSE WEBSOCKET STATUT CODE ${response.responseStatusCode}`) : logger.info(`STATUS : ${response.responseStatusCode}`);
                isWebSocketRequest(options.headers) ? logger.info(`THE RESPONSE HEADERS  is :${JSON.stringify(response.responseHeaders)}`) : "";
                logger.info(`✅ Received response from local Fastify server: ${responseStatusCode} ${responseStatusMessage}`);
                resolve(response);
            });
        });
        // Handle errors during the HTTP request
        req.on("error", (error) => {
            logger.error(`⚠️ Error forwarding request to Fastify server: ${error.message}`);
            reject(error);
        });
        // Handle request timeouts
        req.on("timeout", () => {
            logger.error("⏰ Request to local Fastify server timed out");
            req.destroy(); // Destroy the request to free resources
            reject(new Error("Request to local Fastify server timed out"));
        });
        // End the HTTP request
        req.end();
    });
};
/**
 * Event handler for client disconnections from the main server.
 * Logs the reason for disconnection.
 */
socketServer.on("disconnect", (reason) => {
    logger.warn(`🔌 Disconnected from main server: ${reason}`);
});
const createSocketconnection = (request, port) => __awaiter(void 0, void 0, void 0, function* () {
    logger.warn("CREATING A WS CONNECTION !!!");
    const wsURL = `ws://localhost:${port}/`; // Fixed to the dedicated endpoint
    WsURL = wsURL;
    logger.info(`Requesting a WebSocket connection with ${wsURL}`);
    const socket = new WebSocket(wsURL, request.headers["sec-websocket-protocol"]);
    ws = socket;
    logger.info("socket sets , now waiting for update");
    console.log(socket);
    if (ws) {
        ws.on("open", () => {
            logger.info(`🔄 WEBSOCKET OPEN TO ${WsURL}`);
        });
        ws.on("message", (data) => {
            logger.info(`✅ Received response data from local Fastify server over WebSocket: ${data}`);
            sendWebsocketResponse(data);
        });
        ws.on("error", (error) => {
            logger.error(`⚠️ Error in WebSocket connection to server: ${error}`);
        });
        ws.on("close", (reason) => {
            logger.warn(`🔌 WebSocket connection closed , ${reason}`);
        });
    }
    else {
        logger.error("WebSocket connection failed, could not establish connection");
    }
});
/**
 * Event handler for connection errors.
 * Logs the error and exits the process.
 */
socketServer.on("error", (err) => {
    logger.error(`❌ Connection error: ${err.message}`);
    process.exit(1); // Exit the application on connection error
});
/**
 * Event handler for connection errors during connection attempts.
 * Logs the specific error encountered.
 */
socketServer.on("connect_error", (error) => {
    logger.error(`⚠️ Connection error during connection attempt: ${error}`);
});
/**
 * Event handler for reconnection attempts.
 * Logs each reconnection attempt with the attempt number.
 */
socketServer.on("reconnect_attempt", (attempt) => {
    logger.warn(`🔄 Reconnection attempt #${attempt} to the main server...`);
});
socketServer.on('WebSocketMessage', (message) => {
    console.log("message received from the main server :", message);
    ws.send(message);
    logger.info("Message sent to the server");
});
const isWebSocketRequest = (headers) => {
    return (headers.upgrade === "websocket" && headers.connection === "upgrade");
};
