# --- Stage 1: Base Image ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# --- Stage 2: Development ---
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# --- Stage 3: Production ---
FROM base AS production
RUN npm install --only=production
COPY . .

# שינוי בעלות על התיקייה לטובת משתמש node לצורכי אבטחה
RUN chown -R node:node /usr/src/app

# מעבר למשתמש הלא-מורשה
USER node

CMD ["npm", "start"]