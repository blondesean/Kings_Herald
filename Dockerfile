FROM node:20-alpine

WORKDIR /app

# Install production deps in a separate layer so source changes don't bust the cache
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the source (subject to .dockerignore)
COPY . .

# Drop root for runtime
USER node

CMD ["node", "src/index.js"]
