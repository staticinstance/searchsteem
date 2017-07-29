FROM node:argon

RUN mkdir /app
WORKDIR /app
COPY . /app
RUN npm install



ARG NODE_ENV=production

RUN npm install -g pushstate-server
RUN pushstate-server build
CMD open http://localhost:3000

EXPOSE 80
