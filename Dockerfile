FROM node:argon

RUN mkdir /app
WORKDIR /app
COPY . /app
RUN npm install



ARG NODE_ENV=production

RUN npm install -g pushstate-server
CMD pushstate-server build

EXPOSE 9000
