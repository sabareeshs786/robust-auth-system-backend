FROM alpine:latest
RUN apk update
RUN apk add --no-cache curl gnupg nodejs npm bash
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3500
CMD ["npm", "run", "dev"]