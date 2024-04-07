FROM ubuntu:latest
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3500
CMD ["npm", "run", "dev"]