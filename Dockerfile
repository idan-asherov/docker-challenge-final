# --- שלב 1: הבסיס ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# --- שלב 2: סביבת פיתוח (Dev) ---
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# --- שלב 3: התקנת חבילות פרודקשן בלבד (Builder) ---
FROM base AS production-deps
RUN npm install --only=production

# --- שלב 4: ה-Image הסופי והרזה לפרודקשן ---
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# העתקת החבילות הנקיות בלבד משלב ההתקנה (בלי nodemon ובלי זבל)
COPY --from=production-deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# העתקה סלקטיבית של קבצי המקור הנדרשים לריצה בלבד!
# (אם יש לך תיקיות נוספות כמו public, הוסף אותן כאן)
COPY src/ ./src/
COPY public/ ./public/

# אבטחה: העברת הרשאות למשתמש node
RUN chown -R node:node /usr/src/app
USER node

EXPOSE 3000
CMD ["npm", "start"]