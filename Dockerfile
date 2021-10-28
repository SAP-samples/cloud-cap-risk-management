FROM node:12-slim

ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY gen/srv .
RUN npm install
COPY app app/
RUN find app -name '*.cds' | xargs rm -f

EXPOSE 4004
USER node
CMD [ "npm", "start" ]