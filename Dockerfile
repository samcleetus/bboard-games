# Step 1: Start with Node.js 20
FROM node:20-alpine

# Step 2: Set up working directory inside container
WORKDIR /app

# Step 3: Copy package files first (for efficient caching)
COPY package*.json ./

# Step 4: Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Step 5: Copy environment file and all your app files
COPY .env.production .env
COPY . .

# Step 6: Build your React app for production (now with environment variables)
RUN npm run build

# Step 7: Install a simple web server to serve the built files
RUN npm install -g serve

# Step 8: Tell Docker which port the app will use
EXPOSE 3000

# Step 9: Tell Docker how to start the app
CMD ["serve", "-s", "dist", "-l", "3000"]