# OpenNode Tunnel Client and Server

OpenNode is a tool designed to help developers publish their local servers on the internet. It utilizes Socket.IO for real-time communication between the client and server, and Fastify to handle HTTP requests. The client can register with the server, establish a unique subdomain, and receive HTTP requests via Socket.IO.

## Prerequisites

- Node.js
- npm

### installation
to install speed-tunnel-clientyou can run :

    ```
    npm i -g speed-tunnel-client

    ```

### Usage

- Run the client with the following command:
    ```
    speed-tunnel-client start -p <local-port> -s <subdomain>
    ```
    for example :
     ```
     speed-tunnel-client start --port 5500 --subdomain pinky

     ```

Replace `<local-port>` and `<subdomain>` with the desired values. If successful, the server will respond with the unique subdomain where the local server is accessible.

## Features

- **Socket.IO**: Creates a persistent connection between the client and server.
- **Fastify Integration**: Efficiently handles HTTP requests with high performance.
- **Custom Subdomains**: Each client can be assigned a unique subdomain.
- **Automatic Reconnection**: Supports reconnection in case of disconnection.


## 🚨 Warning

### Security Risks and Usage Conditions

- **Exposing Local Servers**: By using OpenNode, you are opening up a local server to the internet, which poses inherent security risks. Ensure that your local server has proper security configurations to prevent unauthorized access or data breaches.
- **Sensitive Data**: Avoid transmitting sensitive or personal data through the tunnel unless you are certain the data is encrypted and the application is secure.
- **Responsibility**: Users are responsible for securing their local environment and must be aware that any exposed service is potentially accessible by anyone with knowledge of the public URL.
- **Production Use**: This tool is primarily intended for development and testing purposes. Do **not** use it to expose production environments without thoroughly understanding the security implications.
- **IP Rate Limiting**: OpenNode does not inherently implement rate-limiting. You should implement your own rate-limiting mechanism if you expect to receive significant traffic to avoid unintended overloads or abuse.
