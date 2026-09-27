FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 3000

# Start Vite dev server (production build handled separately)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
