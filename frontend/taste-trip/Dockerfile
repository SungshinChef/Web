# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install
# If you use yarn, use: RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expo typically uses ports 19000, 19001 (Metro) and 8081 (Web)
EXPOSE 19000
EXPOSE 19001
EXPOSE 8081

# Define the command to run the Expo app in development mode
CMD [ "npx", "expo", "start" ]
# --host 0.0.0.0 is important for the Metro bundler to be accessible from outside the container 