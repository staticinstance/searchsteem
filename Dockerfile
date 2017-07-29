FROM node:latest

RUN mkdir /app
WORKDIR /app
COPY . /app
RUN npm install



ARG NODE_ENV=production

RUN npm install -g pushstate-server
RUN HTTPS=true npm run build
CMD pushstate-server build

EXPOSE 80
