# Stage 1: Install dependencies and build the app
FROM node:20.12.1 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Stage 2: Run the app without the node_modules directory
FROM node:20.12.1 AS run

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app ./

# Expose the port your app runs on
EXPOSE 3500

# Command to run your app
CMD ["npm", "run", "start"]