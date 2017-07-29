FROM node:argon

RUN mkdir /app
WORKDIR /app
COPY . /app
RUN npm install

CMD npm start

EXPOSE 3000
