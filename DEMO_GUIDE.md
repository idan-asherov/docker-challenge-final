הנה הקובץ המלא והמשודרג של **`DEMO_GUIDE.md`** בגוש העתקה אחד גדול (בלוק קוד יחיד).

הוספתי פנימה סעיף שלם וברור שמציג ומסביר למרצה את פקודות ההרצה השונות של הסביבות (`Development` לעומת `Production`), כדי שהכל יהיה זמין לך במקום אחד וקל להעתקה ישירה לקובץ שלך:

````markdown
# Quick Operational and Demo Guide: Presenting to the Lecturer

## 1. Environment Deployment Commands (How to Load Different Environments)

### Option A: Launching in Development Mode (With Override Settings)

To load the environment with active folder mounting, live code synchronization, and nodemon runtime watching, execute:

```bash
docker compose up --build
```
````

- **How it works:** Docker reads the base configuration and automatically merges the `docker-compose.override.yml` file. This tells the engine to stop at the `development` build stage and execute the `npm run dev` script using `nodemon`.

### Option B: Launching in Pure Production Mode (Bypassing Overrides)

To simulate an immutable, hardened, and highly secure production runtime environment that completely ignores local overrides, execute:

```bash
docker compose -f docker-compose.yml up --build

```

- **How it works:** The `-f` flag restricts Docker Compose to read only the master configuration file. This forces the system to complete the entire multi-stage build up to the `production` target stage, running a clean `npm start` script via `node src/app.js` under a non-root system profile.

---

## 2. Real-Time Verification and Evidence Commands

### Step A: Verify Container Cluster Status and Dependency Parity

While the system is running, open a separate terminal pane and execute:

```bash
docker ps

```

- **What to show the lecturer:** Highlight that the MongoDB service states `Up (healthy)`. Point out the operational delta in the container uptime values: the database container has been up longer than the web application, mathematically proving that the Node.js application remained held in an orchestration dependency lock until the database was fully ready to receive network handshakes. Show him that the port array for the web application is blank, confirming it is securely contained and isolated.

### Step B: Verify the Optimized Production Footprint

To demonstrate image optimization and hardening results, run:

```bash
docker images

```

- **What to show the lecturer:** Point out the streamlined content size of the production image, demonstrating that all developmental dependencies, binaries, and source testing files have been successfully pruned.

---

## 3. Key Discussion Points (Show and Tell Defense Blueprint)

### Topic 1: The Why Behind Multi-Stage Builds

- **Your explanation:** "Instead of shipping a single heavy layer containing everything, we separated our concerns into four distinct stages: Base, Development, Production Dependencies, and Final Production. This architecture allowed us to drop nodemon and unnecessary devDependencies from our deployment layer, lowering core package content weight to just around 54MB."

### Topic 2: Resolving the Race Condition (Healthcheck and Dependency Strategy)

- **Your explanation:** "Originally, standard container dependency orchestrations only check if a target process namespace has initiated. To prevent connection drops caused by MongoDB still executing internal initialization routines while the Node server tries to bind its database pooling layer, we added a live automated ping diagnostic check (`db.adminCommand('ping')`). The web container stays safely in a dependency block until this check passes."

### Topic 3: Securing the Host via Non-Root Profiles

- **Your explanation:** "Running production clusters with default root profiles opens up severe risks of container escape exploits if an application-level vulnerability is compromised. To align with proper secure infrastructure guidelines, we recursively mapped ownership of our execution workspace to the built-in system node profile (`chown -R node:node`) and stripped management capabilities using the `USER node` directive before the server runtime initialization."

### Topic 4: Front-End Abstraction via Nginx Reverse Proxy

- **Your explanation:** "To adhere to modern network security practices, we decoupled the core application port 3000 from public routing and placed an Nginx Reverse Proxy on port 80 at the system entry gate. This effectively masks our technology stack from direct fingerprinting, offloads static file streaming from the single-threaded Node.js event loop, and sets up a foundation for future horizontal cluster scaling."

```

```
