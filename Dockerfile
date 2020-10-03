FROM node:10-alpine

RUN mkdir /app

WORKDIR /app

COPY package.json .
# COPY yarn.lock .
RUN yarn install 

# copy over src files 
COPY ./server.js /app/

# Run the app
CMD ["yarn","start"]

