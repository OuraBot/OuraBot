FROM node:14

WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN yarn install

# Common
COPY Common/ ./Common/
RUN cd Common && yarn install
RUN cd Common && yarn build

# Bot
COPY Bot/ ./Bot/
RUN cd Bot && yarn install

# Frontend
# COPY Frontend/ ./Frontend/
# RUN cd Frontend && yarn install

# RUN cd Frontend && yarn build

EXPOSE 3000
EXPOSE 6379

# Start the Frontend and Bot
RUN cd /app/

RUN yarn bot start
# RUN yarn frontend start
